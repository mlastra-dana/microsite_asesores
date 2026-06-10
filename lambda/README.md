# Lambda para microsites de asesores

Esta Lambda recibe solicitudes del microsite y responde con JSON. No usa dependencias externas.

## Crear la Lambda

1. En AWS Lambda, crea una nueva funcion.
2. Runtime sugerido: Python 3.12.
3. Copia el contenido de `lambda/index.py` en el editor de codigo.
4. Handler: `index.lambda_handler`.
5. Crea una Function URL o conecta API Gateway.
6. Habilita CORS con:
   - Origin: `*`
   - Headers: `Content-Type,Authorization`
   - Methods: `OPTIONS,POST,GET`

## Conectar con Amplify

En AWS Amplify, agrega una variable de entorno:

```bash
VITE_API_URL=https://xxxxx.lambda-url.region.on.aws/
```

Luego vuelve a desplegar la app. Si `VITE_API_URL` no existe, el frontend guarda los eventos en `localStorage` para que la demo funcione sin backend.

## Eventos soportados

`quote_request`: solicitud de cotizacion de un cliente.

`advisor_update`: solicitud del asesor para actualizar sus datos.

`pass_request`: solicitud para generar carnet Apple `.pkpass` o pase Android.

`landing_provision`: provisionamiento del microsite desde Data Retrieval API o DANAconnect.

`otp_request`: solicitud de OTP para que el asesor entre a su espacio.

`otp_verify`: validacion del OTP.

## Roadmap backend

El backend definitivo se mantiene en Python. La Lambda puede evolucionar para:

- Consultar la Data Retrieval API o DANAconnect y traer el registro del asesor.
- Generar un slug limpio y una URL canonica.
- Guardar los datos en DynamoDB.
- Crear o solicitar archivos `.pkpass` para Apple Wallet.
- Crear un pase compatible con Android Wallet.
- Generar y validar OTP para el acceso del asesor.
- Enviar eventos a DANAconnect o EventBridge.
