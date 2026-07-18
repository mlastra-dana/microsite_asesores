# Validaciones de negocio y operacion

Este documento separa lo que ya esta definido para el piloto de lo que conviene validar en reunion. La idea es que la conversacion sea fluida: primero decisiones de negocio con cliente, luego detalles operativos con la KAM/DANA.

## Decisiones cerradas para el piloto

### `ADVISORID`

`ADVISORID` siempre sera provisto por Mercantil Seguros.

Es el identificador unico del asesor dentro del negocio. Se puede mostrar dentro del microsite como codigo del asesor, pero no se usa directamente como identificador publico de la URL.

### Enlace permanente sin login

El microsite del asesor sera accesible sin login.

Esta decision evita duplicar la funcion del portal de asesores existente. El objetivo del microsite es que el asesor pueda abrir, guardar y compartir su enlace permanente de forma directa para gestionar su actividad comercial.

Control actual:

La URL usa un `PUBLICID` enmascarado y no secuencial. Ese valor no expone ni el `ADVISORID` ni el `MICROSITEID`.

Esto es importante porque el `ADVISORID` de Mercantil es un identificador interno del negocio y puede seguir una logica conocida o secuencial. Si ese valor se usara directamente en la URL, un asesor podria intentar deducir enlaces de otros asesores. Con el `PUBLICID` enmascarado, la URL publica no permite inferir el codigo real ni avanzar por una secuencia.

Alcance del control:

El enlace funciona como una URL publica. El enmascaramiento reduce exposicion de identificadores internos, pero no convierte el microsite en un portal autenticado.

Recomendacion:

Mantener el modelo sin login para esta etapa. Si mas adelante Mercantil requiere una capa adicional, evaluar controles ligeros que no dupliquen el portal actual, por ejemplo enlaces firmados, expiracion opcional para acciones sensibles o validaciones solo en formularios internos.

### Fuente operativa del microsite

DANA es el centro operativo de la solucion.

Los datos del asesor se cargan y actualizan en la lista de contactos de DANA. Los flujos de DANA ejecutan nodos API hacia la Lambda para generar, actualizar o desactivar el snapshot en DynamoDB.

El microsite publico no consulta DANA en cada visita. Carga desde DynamoDB para que el enlace permanente funcione rapido y no dependa de un correo, una sesion o un parametro temporal de DANA.

### Estado operativo del microsite

El estado operativo se controla con estos campos de DANA:

```text
MICROSITEACTIVADO
UPDATE
```

La Lambda no escribe el campo `UPDATE`. Ese campo lo actualizan los nodos Update de DANA al final de cada rama del flujo.

### Campos editables por el asesor

El asesor nunca puede modificar `ADVISORID` desde el microsite.

Los datos que puede proponer actualizar son solo campos de perfil/contacto:

```text
TELEFONOASESOR
EMAILASESOR
CIUDADASESOR
WEBSITEASESOR
CONTACTOASESOR
BIOASESOR
```

Esas solicitudes no cambian directamente el dato productivo. Deben pasar por el proceso oficial definido por Mercantil/DANA antes de reflejarse en DANA y DynamoDB.

### URLs de cotizadores

Cada cotizador habilitado debe tener su URL configurada en DANA por asesor.

Las banderas `COTIZADOR_*` definen si un producto se muestra o no para un asesor. Las URLs de esos cotizadores tambien deben venir desde DANA en el registro de ese asesor, porque DANA es el punto de control operativo y esos enlaces pueden cambiar.

Ejemplo de campos esperados:

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

Si una URL cambia para un asesor, se actualiza en DANA y luego el flujo `UPDATE=ACTUALIZAR` sincroniza DynamoDB. Si un cotizador esta habilitado con `SI` pero no tiene URL, el frontend no debe mostrarlo.

## A validar con cliente

Estos puntos son decisiones de negocio, auditoria o alcance comercial. La reunion con cliente deberia enfocarse en confirmar reglas, no en detalles tecnicos de nodos.

### Baja de asesores

Validacion requerida:

Confirmar que toda salida de servicio debe pasar por el flujo `UPDATE=DESACTIVAR` antes de eliminar o remover un asesor de la lista de DANA.

Por que importa:

DynamoDB conserva el snapshot que usa el enlace permanente. Para que el estado publico sea consistente, la salida de servicio debe quedar reflejada por el flujo de desactivacion.

Criterio actual:

La baja debe ser explicita. El flujo de DANA debe ejecutar `advisor_sync` con `action=deactivate`, guardar `micrositeActive=false` en DynamoDB y actualizar `MICROSITEACTIVADO=NO` en DANA.

Impacto:

El enlace permanente sigue existiendo como URL, pero el backend responde que el microsite no esta activo y el frontend muestra el estado inactivo.

### Reactivacion de asesores

Validacion requerida:

Confirmar si un asesor que fue desactivado puede reactivarse posteriormente.

Por que importa:

Si la reactivacion se permite, el microsite debe conservar el mismo `MICROSITEID` y la misma `MICROSITEURL` para no romper enlaces ya enviados o guardados por el asesor.

Criterio actual:

Permitir reactivacion mediante el mismo flujo de actualizacion, enviando `MICROSITEACTIVADO=SI` y `UPDATE=ACTUALIZAR` desde DANA. La Lambda actualiza DynamoDB con `micrositeActive=true` y conserva el identificador publico ya existente.

Impacto:

El asesor puede volver a estar activo sin cambiar su enlace permanente. Esta regla debe quedar aprobada para saber si aplica como operacion regular o solo en casos excepcionales.

### Conservacion historica

Validacion requerida:

Confirmar si los registros en DynamoDB deben conservarse historicamente aun cuando el asesor sea desactivado.

Por que importa:

Conservar registros permite auditoria y trazabilidad. Borrarlos reduce almacenamiento, pero elimina evidencia operativa de que el microsite existio, fue actualizado o fue inactivado.

Criterio actual:

Conservar el registro y marcar `micrositeActive=false`, sin borrado automatico.

Impacto:

No se pierde historia y el enlace permanente puede responder de forma controlada como microsite inactivo.

### Alta de productos/cotizadores nuevos

Validacion requerida:

Definir si el alta de un producto/cotizador nuevo se manejara como solicitud puntual de servicio/evolutivo.

Por que importa:

Hoy cada producto tiene campos especificos en DANA para habilitarlo y guardar su URL. Este modelo es adecuado para el piloto y para un segmento controlado de asesores. Si aparece un producto nuevo, requiere crear campos en DANA, ajustar nodos API, actualizar Lambda/frontend y validar el flujo.

Criterio actual:

Mantener campos explicitos por producto para esta etapa. Si Mercantil solicita agregar un producto nuevo, evaluarlo como cambio controlado coordinado por KAM/cliente/equipo tecnico.

Referencia tecnica futura:

Si mas adelante se quiere evitar cambios de codigo por producto, se puede evolucionar a un modelo dinamico donde DANA envie una lista de cotizadores por asesor, por ejemplo `COTIZADORES_JSON` o una lista/catalogo adicional.

### Solicitudes de actualizacion del perfil del asesor

Validacion requerida:

Definir donde debe recibirse y aprobarse una solicitud de actualizacion enviada desde el microsite.

Por que importa:

El microsite puede capturar una solicitud de cambio, pero no debe modificar directamente el dato productivo sin pasar por el proceso oficial de Mercantil/DANA.

Criterio actual:

El microsite solo registra la solicitud. El dato visible en produccion cambia cuando la fuente oficial actualiza DANA y el flujo `UPDATE=ACTUALIZAR` sincroniza DynamoDB.

Opciones de negocio:

1. Crear una lista de contactos en DANA para solicitudes de actualizacion del asesor.
   Ahi se guardan los datos propuestos, evidencia y estado de revision. Luego un flujo aprobado actualiza la lista principal `Microsite_asesores`.

2. Consumir un servicio de Mercantil/banco para enviar la solicitud al sistema oficial donde viven los datos del asesor.
   Cuando ese sistema confirme o aplique el cambio, DANA actualiza la lista principal y ejecuta el nodo API hacia la Lambda.

### Retencion de eventos operativos

Validacion requerida:

Definir por cuanto tiempo se deben guardar eventos operativos, si aplica.

Eventos posibles:

- Solicitudes de cotizacion.
- Solicitudes de actualizacion de datos.
- Desactivaciones de microsites.
- Respuestas de los nodos API de DANA.
- Clicks en cotizadores, si se implementa tracking de clicks.

Por que importa:

Esto impacta auditoria, reclamos, trazabilidad, privacidad y almacenamiento.

Criterio actual:

Guardar solo lo necesario para operar el flujo actual y conservar el snapshot del asesor en DynamoDB. No aplicar borrado automatico hasta que cliente/auditoria defina una politica formal de retencion.

## A validar con KAM / operacion DANA

Estos puntos definen como se llevarian a cabo las decisiones dentro de DANA. No deben mezclarse con las decisiones de negocio, porque aqui se valida factibilidad operativa, configuracion de listas, flujos y nodos.

### Registro de clicks por cotizador

Objetivo:

Que DANA pueda medir la actividad comercial del microsite: que asesor recibio clicks, sobre que producto, en que fecha y hacia que cotizador.

Alternativas a validar:

1. Links trackeables administrados por DANA.

   En este modelo, los campos `COTIZADOR_*_URL` no apuntan necesariamente directo al cotizador final. Apuntan a un link generado o controlado por DANA.

   Flujo esperado:

   ```text
   Usuario hace click en el microsite
   Frontend abre el link guardado en DANA
   DANA registra el click
   DANA redirige al cotizador final
   ```

   DANA tendria que:

   - Generar o administrar un link por asesor/producto.
   - Registrar el click cuando ese link se abre.
   - Redirigir al cotizador real.
   - Permitir consultar o reportar esos clicks.

   Implicacion:

   - Es la opcion mas simple para nuestro frontend.
   - Mantiene el tracking dentro del ecosistema DANA.
   - Hay que validar si DANA soporta este tipo de link para enlaces que nacen desde un microsite externo y no desde una comunicacion/correo.

2. Lambda registra el click y luego abre el cotizador.

   En este modelo, el frontend llama a la Lambda antes de abrir el cotizador. La Lambda registra el evento y devuelve la URL final.

   Flujo esperado:

   ```text
   Usuario hace click en el microsite
   Frontend llama la Lambda con advisorId + producto + URL
   Lambda registra el click
   Lambda responde con redirectUrl
   Frontend abre el cotizador final
   ```

   Para que el dato quede en DANA, se propone validar la Conversation API:

   ```text
   POST /api/2.0/rest/conversation/{conversationId}/start/data
   ```

   DANA tendria que:

   - Crear una lista o flujo para clicks, por ejemplo `Microsite_cotizador_clicks`.
   - Proveer el `conversationId` activo de ese flujo.
   - Definir los campos del evento de click.
   - Configurar un flujo minimo que reciba datos, guarde el registro y cierre con un nodo Update si se necesita marcar estado.

   Campos sugeridos para la lista/flujo de clicks:

   ```text
   ADVISORID
   MICROSITEID
   MICROSITEURL
   PUBLICID
   NOMBREASESOR
   PRODUCTO
   COTIZADOR_URL
   CLICK_AT
   SOURCE
   USER_AGENT
   ```

   Implicacion:

   - Da mas control y trazabilidad desde nuestro proyecto.
   - Permite guardar datos mas ricos por click.
   - Requiere validar si operativamente tiene sentido mantener una segunda lista o un segundo flujo para eventos del microsite.
   - Requiere definir que ocurre si DANA no confirma el registro del click. Recomendacion inicial: no bloquear al usuario; abrir el cotizador y registrar el error para revision.

Criterio para conversar con KAM:

No dar por cerrada la opcion todavia. La alternativa Lambda + lista/flujo de clicks parece la mas controlada, pero debe validarse junto con la operacion de DANA y sin mezclarla con el flujo de actualizacion del perfil del asesor.

### Registro de solicitudes de actualizacion del perfil

Objetivo:

Definir como DANA recibira solicitudes de actualizacion enviadas desde el microsite, sin mezclarlas con los clicks de cotizadores.

Alternativas a validar:

1. Lista/flujo especifico para solicitudes de actualizacion de perfil.

   La Lambda envia a DANA los datos propuestos por el asesor y DANA los guarda como solicitud pendiente de revision.

2. Servicio oficial de Mercantil.

   La Lambda envia la solicitud a un servicio del banco, y DANA se actualiza cuando ese sistema confirme el cambio.

Campos posibles si se usa lista en DANA:

```text
ADVISORID
MICROSITEID
PUBLICID
NOMBREASESOR
EMAIL_ACTUAL
TELEFONO_ACTUAL
CIUDAD_ACTUAL
EMAIL_PROPUESTO
TELEFONO_PROPUESTO
CIUDAD_PROPUESTA
BIO_PROPUESTA
REQUEST_AT
STATUS
```

Punto clave:

Este flujo es distinto al tracking de clicks. Aunque ambos podrian usar listas/flows adicionales en DANA, deben tratarse como procesos separados.

### Operacion de nodos API actuales

Validacion requerida:

Confirmar que los tres caminos actuales en DANA quedan operativamente claros:

```text
GENERAR
ACTUALIZAR
DESACTIVAR
```

Puntos a revisar con KAM/DANA:

- Condiciones de entrada por `MICROSITEACTIVADO` y `UPDATE`.
- Campos que se escriben en cada nodo Update.
- Confirmar que solo el flujo de generar escribe `MICROSITEID` y `MICROSITEURL`.
- Confirmar que actualizar y desactivar no borran ni reescriben el enlace permanente.
- Confirmar como se registrara el response de cada nodo en DANA.
