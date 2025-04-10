# API Darushop

API GraphQL para el marketplace Darushop, desarrollada con Node.js, Apollo Server, MongoDB y TypeScript.

## Tecnologías Principales

- **Backend**: Node.js con TypeScript
- **API**: GraphQL (Apollo Server 4)
- **Base de datos**: MongoDB
- **Autenticación**: JWT
- **Pagos**: Stripe y OpenPay
- **Envío de correos**: Nodemailer
- **Gestión de archivos**: Multer
- **Seguridad**: HTTPS con SSL
- **Integración de envíos**: FedEx

## Instalación

1. **Clona el repositorio**
   ```bash
   git clone git@github.com:fjpimienta/daru.git
   cd daruapi
   ```

2. **Configura la versión de Node.js**
   
   El proyecto está configurado para funcionar con Node.js v22.14.0 y npm 10.9.0 o superiores según el package.json:
   
   - Si tienes nvm instalado:
     ```bash
     nvm install 22.14.0
     nvm use 22.14.0
     ```
   - Si no tienes la versión correcta y no puedes actualizarla, puedes modificar el campo `engines` en `package.json` para usar tu versión actual (bajo tu propio riesgo).

3. **Instala las dependencias**
   ```bash
   npm install
   ```

4. **Configura las variables de entorno**

   Copia el archivo `.env.example` (si existe) a `.env` y configura las variables necesarias:
   ```bash
   cp .env.example .env  # Si existe .env.example
   ```
   
   Variables de entorno importantes que debes configurar:
   - `PORT`: Puerto del servidor (default: 3002)
   - `DATABASE`: URL de conexión a MongoDB
   - `SECRET`: Clave secreta para JWT
   - `STRIPE_API_KEY` y `OPENPAY_*`: Credenciales para pasarelas de pago
   - `FEDEX_*`: Credenciales para integración con FedEx

5. **Certificados SSL**

   El servidor utiliza HTTPS. Si los certificados no existen, el sistema intentará generar certificados auto-firmados ejecutando:
   ```bash
   npm run generate-ssl
   ```

   Para producción, reemplaza estos certificados con certificados válidos.

## Ejecución

### Desarrollo

```bash
npm run dev
```

El servidor se iniciará en modo desarrollo con nodemon, que reiniciará automáticamente la aplicación cuando detecte cambios en los archivos.

### Producción

```bash
npm run build
npm start
```

## Endpoints Principales

- **API GraphQL**: `https://localhost:3002/graphql`
- **GraphQL Playground**: `https://localhost:3002/graphiql`
- **Servicio de archivos**: `https://localhost:3002/files`
- **Subida de archivos**: `https://localhost:3002/upload`
- **Archivos estáticos**: `https://localhost:3002/uploads/*`

## Scripts Disponibles

- `start`: Inicia el servidor desde la carpeta build
- `build`: Compila el proyecto TypeScript
- `dev`: Inicia el servidor en modo desarrollo con recarga automática
- `generate-ssl`: Genera certificados SSL auto-firmados

## Estructura de Directorios

- `src/`: Código fuente TypeScript
  - `schema/`: Definiciones de tipos y resolvers GraphQL
  - `lib/`: Bibliotecas y utilidades
  - `services/`: Servicios de la aplicación
  - `interfaces/`: Interfaces TypeScript 
  - `utils/`: Utilidades generales

## Gestión de Dependencias

Si encuentras vulnerabilidades en las dependencias, puedes intentar solucionarlas con:

```bash
npm audit fix
```

Para soluciones más agresivas (con posibles cambios importantes):

```bash
npm audit fix --force
```

Después de ejecutar estos comandos, revisa cuidadosamente los cambios en `package-lock.json` y prueba la aplicación para verificar que todo funcione correctamente.

## Información Adicional

Este proyecto es parte del ecosistema Darushop que incluye:

- Frontend para clientes: `https://dev.daru.mx/`
- Panel de administración: `https://devadmin.daru.mx/`
- API (este proyecto): `https://apidev.daru.mx:3002/`
