# Microsite para asesores de seguros

Aplicacion React + TailwindCSS para publicar microsites personalizados de asesores de Mercantil Seguros.

El flujo productivo actual usa DANAconnect como fuente operativa de datos, AWS Lambda como capa de sincronizacion y DynamoDB como snapshot de lectura para que cada enlace permanente cargue en cualquier navegador.

## Flujo validado

1. DANAconnect mantiene la lista de contactos `Microsite_asesores`.
2. Un flujo de DANA ejecuta uno de tres nodos API: generar, actualizar o desactivar.
3. El nodo API llama la Lambda con `type=advisor_sync`.
4. La Lambda normaliza los datos, genera o conserva identificadores y guarda el snapshot en DynamoDB.
5. La Lambda responde campos planos para que DANA los guarde con nodos Update.
6. El asesor recibe o conserva su URL permanente `MICROSITEURL`.
7. El frontend consulta la Lambda por `PUBLICID` y muestra el microsite solo si esta activo.

## Documentacion principal

- `docs/dana-nodos-api-microsite.md`: contrato operativo de nodos DANA, JSONs y response mapping.
- `docs/architecture.md`: direccion tecnica y reglas de negocio acordadas.
- `docs/preguntas-cliente.md`: decisiones cerradas y puntos por validar con cliente/KAM.
- `docs/respuestas-reunion-microsite.md`: documento ejecutivo listo para reunion/Word con preguntas y respuestas.
- `lambda/README.md`: variables de entorno, endpoints y permisos de AWS.

## Instalar y correr

```bash
npm install
npm run dev
npm run build
```

## AWS Amplify

Configuracion de build:

```text
Build command: npm run build
Output directory: dist
```

Variable requerida:

```bash
VITE_API_URL=https://cgqoxs2wgjcadbdm2xv7rkbevi0dqyfr.lambda-url.us-east-1.on.aws/
```

## Backend

La Lambda esta en `lambda/index.py`.

Eventos relevantes:

- `advisor_sync`: alta, actualizacion e inactivacion desde nodos API de DANA.
- `get_advisor`: lectura del microsite desde DynamoDB.
- `quote_request`: solicitud de cotizacion.
- `advisor_update`: solicitud de actualizacion de datos.

## Decisiones de negocio cerradas

- DANAconnect es la fuente operativa. Los datos se cargan o actualizan en la lista de contactos de DANA.
- El microsite publico carga desde DynamoDB, no consulta DANA en cada visita.
- `ADVISORID` lo provee siempre Mercantil Seguros y se trata como identificador unico del asesor.
- La URL publica no expone `ADVISORID` ni `MICROSITEID`; usa un `PUBLICID` enmascarado.
- Las altas, actualizaciones e inactivaciones se ejecutan desde flujos de DANA con nodos API.
- El campo `UPDATE` lo escriben los nodos Update de DANA, no la Lambda.
- No hay borrado automatico de registros en DynamoDB; la baja se maneja marcando el microsite como inactivo.

## Identificadores

- `ADVISORID`: codigo unico del asesor generado por Mercantil Seguros. Puede mostrarse dentro del microsite.
- `MICROSITEID`: identificador interno guardado en DANA. No se expone en la URL publica.
- `advisorId` en Lambda/Dynamo: `PUBLICID` enmascarado usado en `/asesor/{PUBLICID}`.
- `MICROSITEURL`: enlace permanente publico que se guarda en DANA y se envia al asesor.

## Estados

```text
Nuevo pendiente:
  MICROSITEACTIVADO vacio
  UPDATE vacio

Generado:
  MICROSITEACTIVADO SI
  UPDATE GENERADO

Actualizado:
  MICROSITEACTIVADO SI
  UPDATE ACTUALIZADO

Desactivado:
  MICROSITEACTIVADO NO
  UPDATE DESACTIVADO
```

El campo `UPDATE` lo escriben los nodos Update de DANA, no la Lambda.

## Decisiones pendientes

Las decisiones que aun deben cerrarse con cliente, negocio o auditoria estan documentadas en `docs/preguntas-cliente.md`. Ese documento explica que se debe decidir, por que importa y cual es la propuesta actual del proyecto.
