const express = require('express'); 
const app = express(); 
const { v4: uuidv4 } = require('uuid')
app.use(express.json()); 

const customers = [];

// Middleware 
function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers; 
    const customer = customers.find(customer => customer.cpf === cpf);
    
    if(!customer){
        return response.status(400).json({ error: "Customer not found!" }); 
    } 
     
    request.customer = customer; 
    return next(); 
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount; 
        } else {
            return acc - operation.amount; 
        }
    }, 0); 

    return balance; 
}

// Deve ser possível criar uma conta 
app.post('/account', (request,response) => {
    const { cpf, name } = request.body; 

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf); 

    if(customerAlreadyExists) { 
        return response.status(400).json({error: "Customer already exists!"})
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send(); 


});

// Deve ser possível buscar o extrato bancário do cliente 
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    return response.json(customer.statement); 
});

// Deve ser possível realizar um depósito na conta 
app.post('/deposit',  verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body; 
    const { customer } = request; 

    const statementOperation = { 
        description, 
        amount,
        create_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation); 

    return response.status(201).send(); 
})

// Deve realizar um saque, não deve fazer um saque com o saldo insuficiente
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body; 
    const { customer } = request; 

    const balance = getBalance(customer.statement); 

    if(balance < amount){
        return response.status(400).json({error: "Insufficient funds!"}); 
    }

    const statementOperation = {  
        amount,
        create_at: new Date(),
        type: 'debit'
    };

    customer.statement.push(statementOperation); 

    return response.status(201).send(); 
});

// Deve realizar o saldo bancário 
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    const { date } = request.query; 

    const dateFormat = new Date(date + " 00:00"); 

    const statement = customer.statement.filter(
        (statement) => statement.created_at === new Date(dateFormat));

    return response.json(statement); 
});

// Atualizar dados do cliente
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body; 
    const { customer } = request; 

    customer.name = name; 

    return response.status(201).send(); 

})

// Obter dados da conta
app.get('/account/', verifyIfExistsAccountCPF,  (request, response) => {
    const { customer } = request; 

    return response.json(customer); 
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1); 

    return response.status(200).json(customers); 
}); 

app.get('/balance', verifyIfExistsAccountCPF, (request, response) =>{
    const { customer } = request;

    const balance = getBalance(customer.statement); 

    return response.json(balance)
}); 

app.listen(3333); 
