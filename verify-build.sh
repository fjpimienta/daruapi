#!/bin/bash

echo "Verificando archivos GraphQL en la compilación..."
echo "Archivos GraphQL en src:"
find src/schema -name "*.graphql" | sort

echo "Archivos GraphQL en build:"
find build/schema -name "*.graphql" | sort

# Si no hay archivos en build, copiarlos manualmente
if [ $(find build/schema -name "*.graphql" | wc -l) -eq 0 ]; then
  echo "No se encontraron archivos .graphql en build/schema, copiando manualmente..."
  cp src/schema/*.graphql build/schema/
fi

echo "Archivos GraphQL en build después de la verificación:"
find build/schema -name "*.graphql" | sort
