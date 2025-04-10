#!/bin/bash

BUILD_DIR="build/schema"
BASE_SCHEMA_FILE="$BUILD_DIR/base.graphql"

# Asegurarse que el directorio existe
mkdir -p "$BUILD_DIR"

# Verificar si base.graphql existe en el directorio de compilación
if [ ! -f "$BASE_SCHEMA_FILE" ]; then
  echo "Creando archivo base.graphql en directorio de compilación..."
  cat > "$BASE_SCHEMA_FILE" << EOL
type Query {
  _: Boolean
}

type Mutation {
  _: Boolean
}

type Subscription {
  _: Boolean
}
EOL
  echo "Archivo base.graphql creado."
fi

# Listar archivos GraphQL en el directorio de compilación
echo "Archivos GraphQL en directorio de compilación:"
# find "$BUILD_DIR" -name "*.graphql" -type f | sort

# Crear archivo fixed-types.js si no existe
FIXED_TYPES_FILE="$BUILD_DIR/fixed-types.js"
if [ ! -f "$FIXED_TYPES_FILE" ]; then
  echo "Creando archivo fixed-types.js en directorio de compilación..."
  cat > "$FIXED_TYPES_FILE" << EOL
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseResolvers = exports.baseTypes = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.baseTypes = (0, graphql_tag_1.gql)\`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
\`;
exports.baseResolvers = {
    Query: {
        _: () => true
    }
};
EOL
  echo "Archivo fixed-types.js creado."
fi

echo "Todo listo para ejecutar la aplicación."
