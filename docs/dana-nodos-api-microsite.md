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
  "COTIZADOR_SIMPLIFICADO_URL": "$s{COTIZADOR_SIMPLIFICADO_URL}",
  "COTIZADOR_VITALES": "$s{COTIZADOR_VITALES}",
  "COTIZADOR_VITALES_URL": "$s{COTIZADOR_VITALES_URL}",
  "COTIZADOR_AUTO": "$s{COTIZADOR_AUTO}",
  "COTIZADOR_AUTO_URL": "$s{COTIZADOR_AUTO_URL}",
  "COTIZADOR_SALUD": "$s{COTIZADOR_SALUD}",
  "COTIZADOR_SALUD_URL": "$s{COTIZADOR_SALUD_URL}",
  "COTIZADOR_EMERGENCIAS_MEDICAS": "$s{COTIZADOR_EMERGENCIAS_MEDICAS}",
  "COTIZADOR_EMERGENCIAS_MEDICAS_URL": "$s{COTIZADOR_EMERGENCIAS_MEDICAS_URL}",
  "COTIZADOR_PLATINO": "$s{COTIZADOR_PLATINO}",
  "COTIZADOR_PLATINO_URL": "$s{COTIZADOR_PLATINO_URL}",
  "COTIZADOR_TRAVEL": "$s{COTIZADOR_TRAVEL}",
  "COTIZADOR_TRAVEL_URL": "$s{COTIZADOR_TRAVEL_URL}",
  "COTIZADOR_CR": "$s{COTIZADOR_CR}",
  "COTIZADOR_CR_URL": "$s{COTIZADOR_CR_URL}",
  "COTIZADOR_SALUD_PANAMA": "$s{COTIZADOR_SALUD_PANAMA}",
  "COTIZADOR_SALUD_PANAMA_URL": "$s{COTIZADOR_SALUD_PANAMA_URL}"
}
```

## 1. POST generar

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
  "COTIZADOR_SIMPLIFICADO_URL": "$s{COTIZADOR_SIMPLIFICADO_URL}",
  "COTIZADOR_VITALES": "$s{COTIZADOR_VITALES}",
  "COTIZADOR_VITALES_URL": "$s{COTIZADOR_VITALES_URL}",
  "COTIZADOR_AUTO": "$s{COTIZADOR_AUTO}",
  "COTIZADOR_AUTO_URL": "$s{COTIZADOR_AUTO_URL}",
  "COTIZADOR_SALUD": "$s{COTIZADOR_SALUD}",
  "COTIZADOR_SALUD_URL": "$s{COTIZADOR_SALUD_URL}",
  "COTIZADOR_EMERGENCIAS_MEDICAS": "$s{COTIZADOR_EMERGENCIAS_MEDICAS}",
  "COTIZADOR_EMERGENCIAS_MEDICAS_URL": "$s{COTIZADOR_EMERGENCIAS_MEDICAS_URL}",
  "COTIZADOR_PLATINO": "$s{COTIZADOR_PLATINO}",
  "COTIZADOR_PLATINO_URL": "$s{COTIZADOR_PLATINO_URL}",
  "COTIZADOR_TRAVEL": "$s{COTIZADOR_TRAVEL}",
  "COTIZADOR_TRAVEL_URL": "$s{COTIZADOR_TRAVEL_URL}",
  "COTIZADOR_CR": "$s{COTIZADOR_CR}",
  "COTIZADOR_CR_URL": "$s{COTIZADOR_CR_URL}",
  "COTIZADOR_SALUD_PANAMA": "$s{COTIZADOR_SALUD_PANAMA}",
  "COTIZADOR_SALUD_PANAMA_URL": "$s{COTIZADOR_SALUD_PANAMA_URL}"
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

productLinks
  Objeto interno guardado en DynamoDB con la URL por cotizador habilitado.
  DANA no necesita mapear este objeto completo en un campo, porque ya conserva cada URL en sus campos `COTIZADOR_*_URL`.
```

## Campos nuevos para crear en DANA

Crear estos campos tipo texto/URL. Deben existir en la lista `Microsite_asesores` para que cada registro de asesor tenga sus propios enlaces y los nodos API puedan enviarlos a la Lambda.

```text
COTIZADOR_SIMPLIFICADO_URL
COTIZADOR_VITALES_URL
COTIZADOR_AUTO_URL
COTIZADOR_SALUD_URL
COTIZADOR_EMERGENCIAS_MEDICAS_URL
COTIZADOR_PLATINO_URL
COTIZADOR_TRAVEL_URL
COTIZADOR_CR_URL
COTIZADOR_SALUD_PANAMA_URL
```

Regla operativa:

```text
COTIZADOR_AUTO = SI       -> COTIZADOR_AUTO_URL debe tener URL.
COTIZADOR_AUTO = NO/vacio -> COTIZADOR_AUTO_URL puede quedar vacio.
```

El frontend muestra solo los cotizadores habilitados por bandera `SI` que tambien tengan URL. Si un cotizador viene en `SI` pero su campo `COTIZADOR_*_URL` esta vacio, se considera configuracion incompleta y no se muestra.

## Alta de productos nuevos

### Modelo actual

En el piloto/primer segmento, cada producto tiene campos fijos en DANA:

```text
COTIZADOR_PRODUCTO
COTIZADOR_PRODUCTO_URL
```

Este modelo es facil de auditar para un segmento pequeno y es razonable si el catalogo de seguros no cambia con frecuencia. Si se agrega un producto nuevo, debe tratarse como una solicitud de servicio/evolutivo porque hoy habria que:

- Crear los campos nuevos en DANA.
- Agregar esos campos al POST generar.
- Agregar esos campos al POST actualizar.
- Agregar esos campos a `DANA_DATA_FIELDS` si se usa Data Retrieval.
- Agregar el producto al mapeo de la Lambda.
- Agregar el producto/catalogo visual en el frontend.

Por eso, si Mercantil espera agregar productos con frecuencia, conviene evaluar el modelo dinamico descrito abajo. Si el cambio es ocasional, el modelo actual puede mantenerse y el alta de producto se atiende como cambio controlado.

### Modelo recomendado si el catalogo cambia frecuentemente

Mover los cotizadores a un modelo dinamico controlado por DANA.

La idea es que DANA envie una lista de productos habilitados por asesor, por ejemplo en un campo `COTIZADORES_JSON` o armada desde una lista/catalogo adicional:

```json
{
  "COTIZADORES": [
    {
      "codigo": "AUTO",
      "nombre": "Auto",
      "habilitado": "SI",
      "url": "https://link.mercantilseguros.com/Auto_ADS_91827463",
      "orden": 1
    },
    {
      "codigo": "SALUD",
      "nombre": "Salud",
      "habilitado": "SI",
      "url": "https://link.mercantilseguros.com/Salud_ADS_91827463",
      "orden": 2
    }
  ]
}
```

Con ese modelo:

- DANA sigue siendo el cerebro operativo.
- El frontend renderiza cualquier producto recibido sin necesitar campos nuevos por producto.
- La Lambda guarda el snapshot de productos en DynamoDB.
- Agregar un producto nuevo se vuelve una configuracion en DANA/catalogo, no un despliegue de codigo.

Decision pendiente:

Definir si el alta de productos sera una solicitud puntual de servicio o si el catalogo dinamico vivira como `COTIZADORES_JSON` dentro del registro del asesor, como una lista adicional en DANA o como un servicio oficial de Mercantil.

## Estructura del CSV de carga

El CSV de carga para DANA debe conservar exactamente los mismos nombres de columnas y el mismo orden para que el mapeo automatico funcione.

Archivo de referencia en el proyecto:

```text
docs/dana-microsite-asesores-demo.csv
```

Cabecera esperada:

```csv
UID,NombreAsesor ,EmailAsesor,AdvisorId,Update,TelefonoAsesor,FotoAsesor,MicrositeID,MicrositeURL,CiudadAsesor,BioAsesor,WebsiteAsesor,ContactoAsesor,Cotizador_simplificado,Cotizador_simplificado_url,Cotizador_vitales,Cotizador_vitales_url,Cotizador_auto,cotizador_auto_url,Cotizador_salud,Cotizador_salud_url,Cotizador_emergencias_medicas,Cotizador_emergencias_medicas_url,Cotizador_platino,Cotizador_platino_url,Cotizador_travel,Cotizador_travel_url,Cotizador_CR,Cotizador_CR_url,Cotizador_Salud_Panama,Cotizador_salud_panama_url,response_microsite,response_actualizacion,response_baja,Micrositeactivado
```

Notas importantes:

- `NombreAsesor ` tiene un espacio al final en la estructura actual. Debe conservarse mientras DANA lo tenga asi, porque si cambia el header puede fallar el automapeo.
- En registros nuevos para generar, deben venir vacios `Update`, `MicrositeID`, `MicrositeURL`, `response_microsite`, `response_actualizacion`, `response_baja` y `Micrositeactivado`.
- El nodo API de generar devuelve `micrositeId` y `micrositeUrl`; el nodo Update de DANA los escribe en `MicrositeID` y `MicrositeURL`.
- En actualizaciones, `MicrositeID` y `MicrositeURL` ya deben venir poblados y no deben reescribirse desde el nodo Update.
- En desactivaciones, no se borran `MicrositeID` ni `MicrositeURL`; solo se marca el estado operativo y se guarda el response.

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
