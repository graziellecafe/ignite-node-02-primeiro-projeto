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



app.listen(3333); 
