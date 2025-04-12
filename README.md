# API Darushop

## Instalación

1.  Clona el repositorio.
2.  Navega al directorio del proyecto: `cd daruapi`
3.  Instala las dependencias: `npm i`

    *   **Advertencias del motor (Engine Warnings):** Este proyecto fue configurado para Node.js 22.14.0 y npm 10.9.0. Si estás usando una versión diferente, asegúrate de que sea compatible.

        **Para usar Node.js 22.14.0:**

        *   Utiliza `nvm` (Node Version Manager) para cambiar a la versión requerida:
            ```bash
            nvm install 22.14.0
            nvm use 22.14.0
            ```
        *   Después de cambiar la versión de Node.js, reinstala las dependencias: `npm i`

4.  **Aborda las vulnerabilidades:**

    *   Ejecuta `npm audit fix` para intentar solucionar automáticamente las vulnerabilidades.
    *   Si `npm audit fix` no resuelve todas las vulnerabilidades, ejecuta `npm audit fix --force`. **Advertencia:** Esto puede introducir cambios importantes en las dependencias.

        *   Revisa cuidadosamente los cambios realizados en `package-lock.json` y prueba la aplicación para asegurarte de que todo funcione correctamente.

## Variables de entorno

Asegúrate de configurar las siguientes variables de entorno en un archivo `.env` en la raíz del proyecto:

```plaintext
PORT=3002
SECRET="your-secret-key"
DATABASE="your-database-connection-string"
USER_EMAIL="your-email"
USER_PASSWORD="your-password"
CLIENT_URL="your-client-url"
API_URL="your-api-url"
CLIENT_URL_ADMIN="your-admin-client-url"
STRIPE_API_KEY="your-stripe-api-key"
STRIPE_API_VERSION="your-stripe-api-version"
OPENPAY_MERCHANT_ID="your-openpay-merchant-id"
OPENPAY_CLIENT_SECRET="your-openpay-client-secret"
CHECKOUTURL="your-checkout-url"
UPLOAD_URL="your-upload-url"
CONFIRMAR_PEDIDO="true/false"
PRODUCTION="true/false"
FEDEX_CLIENT_ID="your-fedex-client-id"
FEDEX_CLIENT_SECRET="your-fedex-client-secret"
FEDEX_ACCOUNT="your-fedex-account"
```

## Servidor de desarrollo

Ejecuta `npm run dev` para iniciar el servidor en modo desarrollo. Navega a `http://localhost:3002/` para interactuar con la API.

## Construcción

Ejecuta `npm run build` para compilar el proyecto. Los archivos compilados se almacenarán en el directorio `build/`.

## Ejecución en producción

Ejecuta `npm start` para iniciar el servidor en modo producción.

## Pruebas

Actualmente, no se han configurado pruebas unitarias ni de extremo a extremo. Se recomienda agregar un framework de pruebas como Jest o Mocha para garantizar la calidad del código.

## Ayuda adicional

Para obtener más ayuda sobre el proyecto, contacta al autor o consulta la documentación oficial de las dependencias utilizadas.
