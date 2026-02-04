// Script para criar usuário admin via API
const http = require('http');

const data = JSON.stringify({
    email: 'admin@nextfit.com',
    nome: 'Administrador',
    senha: 'admin123',
    role: 'admin'
});

const options = {
    hostname: 'localhost',
    port: 7777,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('='.repeat(50));
            console.log('✅ Usuário Admin Criado com Sucesso!');
            console.log('='.repeat(50));
            console.log('Email: admin@nextfit.com');
            console.log('Senha: admin123');
            console.log('Role: admin');
            console.log('='.repeat(50));
        } else {
            console.log('Status:', res.statusCode);
            console.log('Response:', responseData);
        }
    });
});

req.on('error', (e) => {
    console.error('Erro:', e.message);
    console.log('Certifique-se de que o backend está rodando na porta 7777');
});

req.write(data);
req.end();
