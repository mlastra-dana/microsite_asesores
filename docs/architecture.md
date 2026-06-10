# Direccion tecnica del microsite

Este documento recoge la direccion funcional conversada para darle forma a la app.

## Flujo esperado

1. La app en Amplify recibe una visita a una URL inicial del asesor.
2. En la primera apertura, una Lambda en Python consulta la Data Retrieval API de DANAconnect para traer el registro del asesor desde la lista de contactos usando `danaparam`.
3. La Lambda normaliza los datos, genera un slug limpio y guarda el registro en DynamoDB.
4. El usuario queda redirigido o resuelto hacia una URL limpia, por ejemplo `/asesor/laura-lepage`.
5. Desde ese microsite se puede descargar el contacto, solicitar cotizacion y descargar un carnet tipo wallet/pass.
6. Para Apple se contempla generar `.pkpass`.
7. Para Android se contempla un pase compatible con wallet.
8. El asesor puede entrar a su espacio de actualizacion con OTP, sin depender de un clic de correo ni de un token permanente.

## Backend

El backend se hara con AWS Lambda en Python. La Lambda actual esta en `lambda/index.py`, usa librerias estandar para llamar a DANAconnect y usa `boto3` opcional para DynamoDB.

Eventos previstos:

- `landing_provision`: trae el registro desde Data Retrieval API/DANAconnect, crea slug y guarda en DynamoDB.
- `pass_request`: genera o solicita el pass de Apple/Android.
- `otp_request`: genera un OTP para el asesor.
- `otp_verify`: valida el OTP antes de permitir cambios.
- `quote_request`: recibe solicitudes de cotizacion.
- `advisor_update`: recibe propuestas de actualizacion de datos.

## Persistencia

DynamoDB seria la base para guardar:

- Registro normalizado del asesor.
- Slug limpio.
- URL canonica del microsite.
- Estado de provisionamiento.
- Solicitudes de cotizacion.
- Solicitudes de actualizacion.
- OTP temporal con expiracion.
- Historial de generacion de pases wallet.

## Importante

La demo frontend debe seguir funcionando sin backend real. Si `VITE_API_URL` no existe, los eventos se guardan en `localStorage`.

## Variables Lambda

- `DANA_ACCESS_TOKEN`: token Bearer para Data Retrieval API.
- `DANA_TOKEN_URL`: endpoint OAuth2 para obtener access token.
- `DANA_CLIENT_ID`: client id de DANAconnect.
- `DANA_CLIENT_SECRET`: client secret de DANAconnect.
- `DANA_OAUTH_SCOPE`: scope requerido para Data Retrieval API, si DANA lo exige.
- `DANA_OAUTH_AUTH_METHOD`: `basic` o `body`, segun como DANA espere las credenciales.
- `DANA_BASE_URL`: por defecto `https://appserv.danaconnect.com`.
- `DANA_DATA_FIELDS`: campos a pedir a DANAconnect.
- `DANA_FIELDS_QUERY_PARAM`: nombre del query parameter para pedir campos; por defecto `fields`.
- `MICROSITE_BASE_URL`: dominio publico de Amplify o dominio custom.
- `DYNAMODB_TABLE`: tabla donde guardar registros y eventos.
- `CORS_ORIGIN`: origen permitido para el frontend.
