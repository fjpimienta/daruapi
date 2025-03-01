# API Darushop

## Instalación

1.  Clona el repositorio.
2.  Navega al directorio del proyecto: `cd daruapi`
3.  Instala las dependencias: `npm i`

    *   **Advertencias del motor (Engine Warnings):** Este proyecto fue originalmente configurado para Node.js 18.20.4 y npm 10.7.0. Estás usando Node.js v22.14.0 y npm 10.9.2. Si bien la API puede funcionar, es posible que encuentres problemas de compatibilidad.

        **Para usar Node.js v22.14.0:**

        *   Puedes intentar actualizar el campo `engines` en el `package.json` para reflejar esta versión. Sin embargo, ten en cuenta que esto podría causar problemas si el código depende de características específicas de la versión original de Node.js.
        *   Si decides continuar con Node.js v22.14.0, procede con los siguientes pasos para abordar las vulnerabilidades.

        **Para usar Node.js 18.20.4 (Recomendado):**

        *   Utiliza `nvm` (Node Version Manager) para cambiar a la versión requerida:
            ```bash
            nvm install 18.20.4
            nvm use 18.20.4
            ```
        *   Después de cambiar la versión de Node.js, reinstala las dependencias: `npm i`

4.  **Aborda las vulnerabilidades:**

    *   Ejecuta `npm audit fix` para intentar solucionar automáticamente las vulnerabilidades sin cambios importantes.
    *   Si `npm audit fix` reporta vulnerabilidades no resueltas, ejecuta `npm audit fix --force`.  **Advertencia:** Esto puede introducir cambios importantes en las dependencias.

        *   **Revisión posterior a `npm audit fix --force`:** Después de ejecutar `npm audit fix --force`, revisa cuidadosamente los cambios realizados en tu archivo `package-lock.json` y prueba a fondo tu aplicación para asegurarte de que todo funcione como se espera.  Presta especial atención a las dependencias actualizadas que se mencionan en el informe de auditoría (por ejemplo, `apollo-server-express`, `nodemon`, `sharp`, `xml2js`).

        *   **Vulnerabilidades sin solución automática:** El informe de auditoría también puede indicar vulnerabilidades que requieren revisión manual y posible selección de una dependencia diferente.  Por ejemplo, las vulnerabilidades en `request` y `tough-cookie` pueden requerir que explores alternativas a estas bibliotecas.

## Servidor de desarrollo

Ejecuta `ng serve` para un servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

## Estructura de código

Ejecuta `ng generate component nombre-del-componente` para generar un nuevo componente. También puedes usar `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Construcción

Ejecuta `ng build` para construir el proyecto. Los artefactos de compilación se almacenarán en el directorio `dist/`. Usa la bandera `--prod` para una compilación de producción.

## Ejecución de pruebas unitarias

Ejecuta `ng test` para ejecutar las pruebas unitarias a través de [Karma](https://karma-runner.github.io).

## Ejecución de pruebas de extremo a extremo (E2E)

Ejecuta `ng e2e` para ejecutar las pruebas de extremo a extremo a través de [Protractor](http://www.protractortest.org/).

## Ayuda adicional

Para obtener más ayuda sobre Angular CLI, usa `ng help` o consulta la página [Angular CLI Overview and Command Reference](https://angular.io/cli).
