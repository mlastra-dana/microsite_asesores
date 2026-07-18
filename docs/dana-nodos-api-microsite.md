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

Este nodo Update es el unico que escribe `MICROSITEID` y `MICROSITEURL`, porque en generacion DANA todavia no los tiene.

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

Este nodo Update no modifica `MICROSITEID` ni `MICROSITEURL`; solo cierra el estado operativo y guarda el resultado.

```text
MICROSITEACTIVADO  $.micrositeActivado
RESPONSE_MICROSITE $.message
UPDATE             ACTUALIZADO
```

En actualizacion no reescribas `MICROSITEID` ni `MICROSITEURL`; esos valores ya existen en DANA y deben permanecer estables. La Lambda los devuelve solo como confirmacion.

Si no hay diferencias entre lo que envia DANA y lo que ya esta en DynamoDB, la Lambda responde `200 OK` con:

```text
RESPONSE_MICROSITE Microsite sin cambios para actualizar
UPDATE             ACTUALIZADO
```

Esto permite que el flujo avance y no quede detenido en `UPDATE=ACTUALIZAR`.

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

Este nodo Update no borra `MICROSITEID` ni `MICROSITEURL`; conserva trazabilidad del enlace que fue desactivado.

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

## Significado de campos del response

La Lambda devuelve campos planos para que DANA pueda mapearlos desde el nodo API hacia campos de la lista de contactos.

```text
ok
  Booleano. Indica si la Lambda proceso correctamente el request.

message
  Texto operativo para auditoria y para guardar en RESPONSE_MICROSITE.
  Ejemplos:
  - Microsite sincronizado correctamente
  - Microsite sin cambios para actualizar
  - Microsite inactivado correctamente

type
  Tipo de operacion procesada por la Lambda. Para este flujo debe ser advisor_sync.

action
  Accion recibida por la Lambda. upsert para generar/actualizar, deactivate para inactivar.

advisorId
  PUBLICID enmascarado. Es el identificador publico usado en la URL.
  No es el ADVISORID de Mercantil ni el MICROSITEID interno.

micrositeId
  Identificador interno del microsite. Se guarda en DANA como MICROSITEID.
  Si DANA lo envia vacio al generar, la Lambda lo crea de forma estable usando ADVISORID.

micrositeUrl
  URL publica y permanente del asesor.
  Se guarda en DANA como MICROSITEURL y es el enlace que se envia en el correo.

micrositeActivado
  Estado operativo del microsite en formato SI/NO.
  Se guarda en DANA como MICROSITEACTIVADO.

source
  Origen usado por la Lambda para armar el snapshot.
  En el flujo actual debe ser direct_payload porque DANA envia los campos en el JSON.
```

## Reglas de negocio cerradas

```text
GENERAR
  Condicion: MICROSITEACTIVADO vacio y UPDATE vacio.
  API node: envia datos del asesor sin MICROSITEID/MICROSITEURL.
  Update node: escribe MICROSITEID, MICROSITEURL, MICROSITEACTIVADO, RESPONSE_MICROSITE y UPDATE=GENERADO.

ACTUALIZAR
  Condicion: MICROSITEACTIVADO=SI y UPDATE=ACTUALIZAR.
  API node: envia datos del asesor incluyendo MICROSITEID/MICROSITEURL existentes.
  Update node: no toca MICROSITEID ni MICROSITEURL; escribe MICROSITEACTIVADO, RESPONSE_MICROSITE y UPDATE=ACTUALIZADO.
  Si no hay cambios, la Lambda responde OK y el flujo igual debe cerrar en ACTUALIZADO.

DESACTIVAR
  Condicion: MICROSITEACTIVADO=SI y UPDATE=DESACTIVAR.
  API node: envia ADVISORID, MICROSITEID, MICROSITEURL y MICROSITEACTIVADO=NO.
  Update node: no borra MICROSITEID ni MICROSITEURL; escribe MICROSITEACTIVADO=NO, RESPONSE_MICROSITE y UPDATE=DESACTIVADO.
  El enlace permanente queda vivo como URL, pero el backend responde que el microsite no esta activo.
```

## Preguntas abiertas para cliente/auditoria

```text
- Que debe ocurrir con snapshots existentes en Dynamo si un asesor desaparece de la lista de DANA.
- Si la baja debe ser siempre explicita con UPDATE=DESACTIVAR o si se permitira una conciliacion posterior.
- Periodicidad o evento oficial para refrescar cambios masivos desde DANA.
- Donde se registraran los clicks por cotizador y si cada cotizador tendra URL propia por asesor.
```
