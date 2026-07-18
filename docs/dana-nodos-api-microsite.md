# Nodos API para microsite de asesores

URL Lambda:

```text
https://cgqoxs2wgjcadbdm2xv7rkbevi0dqyfr.lambda-url.us-east-1.on.aws/
```

Headers:

```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

## Enrutamiento por campos de control

Usa `MICROSITEACTIVADO` y `UPDATE` para que los flujos no se pisen entre si:

```text
MICROSITEACTIVADO vacio + UPDATE vacio        -> POST generar
MICROSITEACTIVADO = SI + UPDATE = ACTUALIZAR  -> POST actualizar
MICROSITEACTIVADO = SI + UPDATE = DESACTIVAR  -> POST inactivar
```

## 1. POST generar

Este request no envia `MICROSITEID` ni `MICROSITEURL`. La Lambda los genera y los devuelve en el response.

```json
{
  "type": "advisor_sync",
  "action": "upsert",
  "ADVISORID": "$s{ADVISORID}",
  "NOMBREASESOR": "$s{NOMBREASESOR}",
  "EMAILASESOR": "$s{EMAILASESOR}",
  "TELEFONOASESOR": "$s{TELEFONOASESOR}",
  "FOTOASESOR": "$s{FOTOASESOR}",
  "MICROSITEACTIVADO": "SI",
  "CIUDADASESOR": "$s{CIUDADASESOR}",
  "BIOASESOR": "$s{BIOASESOR}",
  "WEBSITEASESOR": "$s{WEBSITEASESOR}",
  "CONTACTOASESOR": "$s{CONTACTOASESOR}",
  "COTIZADOR_SIMPLIFICADO": "$s{COTIZADOR_SIMPLIFICADO}",
  "COTIZADOR_VITALES": "$s{COTIZADOR_VITALES}",
  "COTIZADOR_AUTO": "$s{COTIZADOR_AUTO}",
  "COTIZADOR_SALUD": "$s{COTIZADOR_SALUD}",
  "COTIZADOR_EMERGENCIAS_MEDICAS": "$s{COTIZADOR_EMERGENCIAS_MEDICAS}",
  "COTIZADOR_PLATINO": "$s{COTIZADOR_PLATINO}",
  "COTIZADOR_TRAVEL": "$s{COTIZADOR_TRAVEL}",
  "COTIZADOR_CR": "$s{COTIZADOR_CR}",
  "COTIZADOR_SALUD_PANAMA": "$s{COTIZADOR_SALUD_PANAMA}"
}
```

## 1. UPDATE generar

```text
MICROSITEID        $.micrositeId
MICROSITEURL       $.micrositeUrl
MICROSITEACTIVADO  $.micrositeActivado
RESPONSE_MICROSITE $.message
UPDATE             GENERADO
```

## 2. POST actualizar

Este request usa los valores actuales de `MICROSITEID` y `MICROSITEURL` que ya guardo DANA al generar el microsite.

```json
{
  "type": "advisor_sync",
  "action": "upsert",
  "ADVISORID": "$s{ADVISORID}",
  "NOMBREASESOR": "$s{NOMBREASESOR}",
  "EMAILASESOR": "$s{EMAILASESOR}",
  "TELEFONOASESOR": "$s{TELEFONOASESOR}",
  "FOTOASESOR": "$s{FOTOASESOR}",
  "MICROSITEID": "$s{MICROSITEID}",
  "MICROSITEURL": "$s{MICROSITEURL}",
  "MICROSITEACTIVADO": "SI",
  "CIUDADASESOR": "$s{CIUDADASESOR}",
  "BIOASESOR": "$s{BIOASESOR}",
  "WEBSITEASESOR": "$s{WEBSITEASESOR}",
  "CONTACTOASESOR": "$s{CONTACTOASESOR}",
  "COTIZADOR_SIMPLIFICADO": "$s{COTIZADOR_SIMPLIFICADO}",
  "COTIZADOR_VITALES": "$s{COTIZADOR_VITALES}",
  "COTIZADOR_AUTO": "$s{COTIZADOR_AUTO}",
  "COTIZADOR_SALUD": "$s{COTIZADOR_SALUD}",
  "COTIZADOR_EMERGENCIAS_MEDICAS": "$s{COTIZADOR_EMERGENCIAS_MEDICAS}",
  "COTIZADOR_PLATINO": "$s{COTIZADOR_PLATINO}",
  "COTIZADOR_TRAVEL": "$s{COTIZADOR_TRAVEL}",
  "COTIZADOR_CR": "$s{COTIZADOR_CR}",
  "COTIZADOR_SALUD_PANAMA": "$s{COTIZADOR_SALUD_PANAMA}"
}
```

## 2. UPDATE actualizar

```text
MICROSITEID        $.micrositeId
MICROSITEURL       $.micrositeUrl
MICROSITEACTIVADO  $.micrositeActivado
RESPONSE_MICROSITE $.message
UPDATE             ACTUALIZADO
```

## 3. POST inactivar

```json
{
  "type": "advisor_sync",
  "action": "deactivate",
  "ADVISORID": "$s{ADVISORID}",
  "MICROSITEID": "$s{MICROSITEID}",
  "MICROSITEURL": "$s{MICROSITEURL}",
  "MICROSITEACTIVADO": "NO"
}
```

## 3. UPDATE inactivar

```text
MICROSITEACTIVADO  $.micrositeActivado
RESPONSE_MICROSITE $.message
UPDATE             DESACTIVADO
```

## Response esperado

Generar o actualizar:

```json
{
  "ok": true,
  "advisorId": "PUBLICID_ENMASCARADO",
  "micrositeId": "MICROSITEID_INTERNO",
  "micrositeUrl": "https://main.d1w0srn8uz6n.amplifyapp.com/asesor/PUBLICID_ENMASCARADO",
  "micrositeActivado": "SI"
}
```

Inactivar:

```json
{
  "ok": true,
  "advisorId": "PUBLICID_ENMASCARADO",
  "micrositeId": "MICROSITEID_INTERNO",
  "micrositeUrl": "https://main.d1w0srn8uz6n.amplifyapp.com/asesor/PUBLICID_ENMASCARADO",
  "micrositeActivado": "NO"
}
```

## 4. Conciliar Dynamo contra DANA

Este request sirve para revisar registros guardados en DynamoDB que ya no existan en la lista de contactos de DANA. Primero ejecutalo sin borrar.

```json
{
  "type": "advisor_reconcile",
  "limit": 250
}
```

Response resumido:

```text
missingRecords  registros candidatos a borrar
errorRecords    registros que no se pudieron validar con seguridad
```

Cuando ya confirmes el resultado, se puede borrar solo lo que DANA reporte como inexistente:

```json
{
  "type": "advisor_reconcile",
  "limit": 250,
  "deleteMissing": true
}
```

La Lambda no borra registros cuando DANA devuelve un error ambiguo o temporal.
