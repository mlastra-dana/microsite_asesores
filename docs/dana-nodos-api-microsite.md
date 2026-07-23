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

Este modelo es facil de auditar para un segmento pequeno y es el alcance definido para el piloto. Si se agrega un producto nuevo, debe tratarse como una solicitud de servicio/evolutivo porque hoy requiere:

- Crear los campos nuevos en DANA.
- Agregar esos campos al POST generar.
- Agregar esos campos al POST actualizar.
- Agregar esos campos a `DANA_DATA_FIELDS` si se usa Data Retrieval.
- Agregar el producto al mapeo de la Lambda.
- Agregar el producto/catalogo visual en el frontend.

Para esta etapa, el modelo actual puede mantenerse y el alta de producto se atiende como cambio controlado. El modelo dinamico queda documentado como referencia tecnica para una etapa posterior.

### Modelo dinamico de referencia

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

## Registro de clicks en cotizadores

El objetivo es que DANA conserve la medicion de clicks por asesor y producto. El frontend no debe abrir un cotizador generico: abre la URL especifica que vino desde DANA para ese asesor y ese producto.

### Opcion A: links trackeables de DANA

En esta opcion, los campos `COTIZADOR_*_URL` contienen URLs administradas por DANA. El frontend abre esa URL y DANA registra el click antes de redirigir al cotizador final.

```text
Usuario hace click
Frontend abre COTIZADOR_*_URL
DANA registra click
DANA redirige al cotizador final
```

Pendiente de validar:

- Si DANA puede generar links trackeables para enlaces usados desde un microsite externo.
- Como se consultan esos clicks por asesor/producto.
- Si el link trackeable puede conservar parametros del asesor y del producto.

### Opcion B: Lambda envia evento de click a DANA

Esta es la opcion que dejamos preparada en el proyecto.

El frontend abre el cotizador en una pestana nueva y, en paralelo, avisa a la Lambda con `quote_click`. La Lambda actua como puente y llama a DANA con Start Conversation para que DANA cree el registro del click.

Importante: el usuario no queda esperando por DANA para cotizar. Si DANA no confirma el registro del click, el cotizador igual abre y el error queda en logs para revision.

Los clicks no se guardan en DynamoDB. DynamoDB queda reservado para el snapshot del microsite; DANA es el repositorio operativo para la medicion de clicks y el dashboard.

```text
Usuario hace click
Frontend -> Lambda: quote_click
Lambda -> DANA Conversation API: start/data
DANA crea registro/flujo de click
Frontend abre cotizador final en una pestana nueva
```

Endpoint candidato de DANA:

```text
POST /api/2.0/rest/conversation/ProjectID/{projectId}/start/data
```

Uso esperado:

- Crear en DANA un flujo/lista para clicks, por ejemplo `Microsite_cotizador_clicks`.
- Obtener el `projectId` de ese flujo.
- Configurar en la Lambda `DANA_CLICK_PROJECT_ID` con ese Project ID.
- La Lambda llama `start/data` con los datos del click.
- El flujo de DANA puede ser minimo: recibir datos, guardar el registro y cerrar con un nodo Update si se necesita marcar estado.

Variables de entorno Lambda:

```text
DANA_CLICK_PROJECT_ID=<project id del flujo de clicks>
DANA_CLICK_AUTH_METHOD=bearer
```

Se usa `ProjectID` porque no queremos depender de una conversacion ya activada ni de un `conversationId` particular. `DANA_CLICK_CONVERSATION_ID` queda solo como compatibilidad tecnica si algun ambiente viejo ya lo usa.

`DANA_CLICK_AUTH_METHOD` puede quedar en `bearer` para usar OAuth. Si el flujo requiere usuario/password, cambiar a `basic`.

Campos sugeridos para la lista/flujo de clicks:

```text
ADVISORID
MICROSITEID
MICROSITEURL
NOMBREASESOR
EMAILASESOR
PRODUCTO
COTIZADOR_URL
USER_AGENT
```

Tipos sugeridos en DANA:

```text
ADVISORID       VARCHAR(50)
MICROSITEID     VARCHAR(100)
MICROSITEURL    MEDIUMTEXT
NOMBREASESOR    VARCHAR(300)
EMAILASESOR     VARCHAR(254)
PRODUCTO        VARCHAR(100)
COTIZADOR_URL   MEDIUMTEXT
USER_AGENT      MEDIUMTEXT
```

Importante: en el JSON se envia el `Code` del campo de DANA, no el `Name` visible en la pantalla. Por eso los campos van en mayusculas.

JSON conceptual que la Lambda enviaria a DANA:

```json
{
  "ADVISORID": "91827463",
  "MICROSITEID": "ABC123",
  "MICROSITEURL": "https://main.d1w0srn8uz6n.amplifyapp.com/asesor/270C3E56BBA225E9",
  "NOMBREASESOR": "Daniela Rivero",
  "EMAILASESOR": "daniela.rivero@example.com",
  "PRODUCTO": "Auto",
  "COTIZADOR_URL": "https://link.mercantilseguros.com/Auto_ADS_91827463",
  "USER_AGENT": "browser"
}
```

La fecha del click queda cubierta por la fecha de insercion/update del flujo en DANA, por eso no se envia `CLICK_AT`. Tampoco se envia `PUBLICID`, `SOURCE`, `REFERER` ni IP.

Response del endpoint `quote_click`:

```json
{
  "ok": true,
  "message": "Click enviado a DANA",
  "type": "quote_click",
  "redirectUrl": "https://link.mercantilseguros.com/Auto_ADS_91827463",
  "danaSent": true
}
```

Significado:

```text
ok
  Indica que la Lambda recibio el click y proceso el evento.

redirectUrl
  URL del cotizador que el frontend abre. Viene desde el campo COTIZADOR_*_URL del asesor.

danaSent
  true si la Lambda logro enviar el evento al flujo de clicks en DANA.
  false si DANA no esta configurado o no acepto el evento.
```

Pendiente operativo:

Validar con KAM/DANA si el flujo de clicks necesita un nodo Update final para marcar el registro como procesado o si basta con iniciar la conversacion/lista con `start/data`.

## Estructura del CSV de carga

El CSV de carga para DANA debe conservar exactamente los mismos nombres de columnas y el mismo orden para que el mapeo automatico funcione.

Archivo de referencia en el proyecto:

```text
docs/dana-microsite-asesores-demo.csv
```

Cabecera esperada:

```csv
NombreAsesor,EmailAsesor,AdvisorId,Update,TelefonoAsesor,FotoAsesor,MicrositeID,MicrositeURL,CiudadAsesor,BioAsesor,WebsiteAsesor,ContactoAsesor,Cotizador_simplificado,Cotizador_simplificado_url,Cotizador_vitales,Cotizador_vitales_url,Cotizador_auto,cotizador_auto_url,Cotizador_salud,Cotizador_salud_url,Cotizador_emergencias_medicas,Cotizador_emergencias_medicas_url,Cotizador_platino,Cotizador_platino_url,Cotizador_travel,Cotizador_travel_url,Cotizador_CR,Cotizador_CR_url,Cotizador_Salud_Panama,Cotizador_salud_panama_url,response_microsite,response_actualizacion,response_baja,Micrositeactivado
```

Notas importantes:

- El CSV de carga no incluye `UID`; DANA genera ese campo automaticamente.
- `NombreAsesor` debe ir sin espacios al inicio o al final para conservar el automapeo en DANA.
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
