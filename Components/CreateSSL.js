const forge = require('node-forge');
const fs = require('fs');

function generateSelfSignedCertificate() {
    // Generate a key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.privateKey = keys.privateKey;

    // Set certificate details
    cert.serialNumber = '01';
    const attrs = [{
        name: 'commonName',
        value: 'localhost'
    }];

    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // Self-sign the certificate
    cert.sign(keys.privateKey);

    // Convert to PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const certPem = forge.pki.certificateToPem(cert);

    // Write to files
    fs.writeFileSync('server.key', privateKeyPem);
    fs.writeFileSync('server.crt', certPem);

    console.log('Self-signed certificate generated');
}

// Requires installing node-forge: npm install node-forge
generateSelfSignedCertificate();