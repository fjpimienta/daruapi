#!/bin/bash

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -nodes -keyout src/_.daru.mx_private_key.key -out src/daru.mx_ssl_certificate.cer -days 365 -subj '/CN=localhost'