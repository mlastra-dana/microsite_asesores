# Puntos de validacion para cliente/auditoria

Este documento resume las decisiones ya cerradas para el piloto y los puntos que conviene validar con cliente, negocio, auditoria o areas tecnicas antes de avanzar a una version productiva.

La idea es dejar claro:

- Que se debe decidir.
- Por que importa.
- Cual es el criterio actual del proyecto cuando ya existe una recomendacion.

## Decisiones cerradas

### `ADVISORID`

`ADVISORID` siempre sera provisto por Mercantil Seguros.

Es el identificador unico del asesor dentro del negocio. Se puede mostrar dentro del microsite como codigo del asesor, pero no se usa directamente como identificador publico de la URL.

### Cambios masivos desde DANA

Los cambios masivos se gestionan actualizando la lista de contactos en DANA y ejecutando los nodos API correspondientes.

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

### Enlace permanente publico

El microsite del asesor sera accesible sin login.

Esta decision evita duplicar la funcion del portal de asesores existente. El objetivo del microsite es que el asesor pueda abrir, guardar y compartir su enlace permanente de forma directa para gestionar su actividad comercial.

Control actual:

La URL usa un `PUBLICID` enmascarado y no secuencial. Ese valor no expone ni el `ADVISORID` ni el `MICROSITEID`.

Esto es importante porque el `ADVISORID` de Mercantil es un identificador interno del negocio y puede seguir una logica conocida o secuencial. Si ese valor se usara directamente en la URL, un asesor podria intentar deducir enlaces de otros asesores. Con el `PUBLICID` enmascarado, la URL publica no permite inferir el codigo real ni avanzar por una secuencia.

Alcance del control:

El enlace funciona como una URL publica. El enmascaramiento reduce exposicion de identificadores internos, pero no convierte el microsite en un portal autenticado.

Recomendacion:

Mantener el modelo sin login para esta etapa. Si mas adelante Mercantil requiere una capa adicional, evaluar controles ligeros que no dupliquen el portal actual, por ejemplo enlaces firmados, expiracion opcional para acciones sensibles o validaciones solo en formularios internos.

## Datos y ciclo de vida

### Baja de asesores

Validacion requerida:

Si un asesor debe salir de servicio, debe pasar obligatoriamente por el flujo `UPDATE=DESACTIVAR` antes de ser eliminado o removido de la lista de DANA.

Por que importa:

DynamoDB conserva el snapshot que usa el enlace permanente. Para que el estado publico sea consistente, la salida de servicio debe quedar reflejada por el flujo de desactivacion.

Propuesta actual:

La baja debe ser explicita. El flujo de DANA debe ejecutar `advisor_sync` con `action=deactivate`, guardar `micrositeActive=false` en DynamoDB y actualizar `MICROSITEACTIVADO=NO` en DANA.

Impacto:

El enlace permanente sigue existiendo como URL, pero el backend responde que el microsite no esta activo y el frontend muestra el estado inactivo.

### Conservacion historica en DynamoDB

Validacion requerida:

Si los registros en DynamoDB deben conservarse historicamente aun cuando el asesor sea desactivado.

Por que importa:

Conservar registros permite auditoria y trazabilidad. Borrarlos reduce almacenamiento, pero elimina evidencia operativa de que el microsite existio, fue actualizado o fue inactivado.

Propuesta actual:

Conservar el registro y marcar `micrositeActive=false`, sin borrado automatico.

Impacto:

No se pierde historia y el enlace permanente puede responder de forma controlada como microsite inactivo.

### Reactivacion de asesores

Validacion requerida:

Si un asesor que fue desactivado puede ser reactivado posteriormente.

Por que importa:

Si la reactivacion se permite, el microsite debe conservar el mismo `MICROSITEID` y la misma `MICROSITEURL` para no romper enlaces ya enviados o guardados por el asesor.

Propuesta actual:

Permitir reactivacion mediante el mismo flujo de actualizacion, enviando `MICROSITEACTIVADO=SI` y `UPDATE=ACTUALIZAR` desde DANA. La Lambda debe actualizar DynamoDB con `micrositeActive=true` y conservar el identificador publico ya existente.

Impacto:

El asesor puede volver a estar activo sin cambiar su enlace permanente. Esta regla debe quedar aprobada por negocio/auditoria para saber si aplica como operacion regular o solo en casos excepcionales.

## Cotizadores

### Alta de nuevos productos

Validacion requerida:

Como se gestionara comercial y tecnicamente el alta de productos/cotizadores nuevos.

Por que importa:

Hoy cada producto tiene campos especificos en DANA para habilitarlo y para guardar su URL. Este modelo es adecuado para el piloto y para un segmento controlado de asesores. Si aparece un producto nuevo, el impacto tecnico y operativo debe estar claro:

- Crear campos nuevos en DANA.
- Agregar esos campos al JSON de los nodos API.
- Ajustar la Lambda para reconocer el producto.
- Ajustar el frontend para mostrarlo con nombre, descripcion, icono y URL.

Ese esfuerzo puede tratarse como una solicitud de servicio/evolutivo, coordinada por la KAM con cliente y equipo tecnico.

Propuesta actual:

Para esta etapa, mantener campos explicitos por producto en DANA porque es mas simple de operar, probar y auditar con el segmento inicial.

Si Mercantil solicita agregar un producto nuevo, se debe evaluar como cambio de alcance: crear campos en DANA, ajustar nodos, actualizar Lambda/frontend y validar el flujo end to end. Comercialmente, esta solicitud puede convertirse en un servicio adicional definido por KAM/cliente.

Guia tecnica para una evolucion futura:

Pasar a un modelo dinamico donde DANA envie a la Lambda una lista de cotizadores por asesor, en vez de un par de campos por cada producto.

Ejemplo conceptual:

```json
{
  "productos": [
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

Con ese modelo, agregar un producto nuevo seria una tarea operativa en DANA/catalogo, no un cambio de codigo.

Opciones para implementar ese modelo:

1. Campo estructurado en la lista principal de asesores, por ejemplo `COTIZADORES_JSON`.
   DANA guarda ahi la lista de productos habilitados para ese asesor.

2. Lista/catalogo adicional en DANA.
   Una lista define productos globales y otra relaciona asesor + producto + URL. Un flujo de DANA arma el JSON final y lo envia a la Lambda.

3. Servicio externo de Mercantil.
   Mercantil expone el catalogo y la relacion asesor-producto; DANA consume o sincroniza esa informacion y luego llama la Lambda.

Impacto:

El modelo actual queda definido para pruebas y primer segmento. Si se solicita un producto nuevo, se tratara como solicitud puntual de servicio/evolutivo; el modelo dinamico queda como referencia tecnica para una etapa posterior.

### Registro de clicks

Validacion requerida:

Donde se registraran los clicks por cotizador: DANA, Lambda, otro servicio o una combinacion.

Por que importa:

Negocio quiere medir cuantas veces se hace click en cada cotizador. Si el click debe quedar registrado en DANA, probablemente el enlace de cada cotizador debe pasar por un tracking link o un flujo/evento de DANA.

Propuesta actual:

Definir los links de cotizadores dentro de DANA para que DANA pueda registrar el click. Si luego se requiere analitica adicional, la Lambda puede recibir eventos de click, pero eso debe validarse como alcance separado.

Impacto:

Esto define si el frontend abre un link directo de DANA, un link de la Lambda o un link externo del banco.

## Actualizacion de datos del asesor

### Destino de solicitudes de actualizacion

Validacion requerida:

Si las solicitudes de actualizacion que hace el asesor desde el microsite deben ir a un servicio del banco, a una lista/flujo de DANA o a otro proceso operativo.

Por que importa:

El microsite puede capturar una solicitud, pero la fuente oficial de datos sigue siendo DANA o el sistema que el banco determine. No debemos actualizar datos sensibles directamente sin flujo aprobado.

Propuesta actual:

Registrar la solicitud como evento y enviarla al flujo que cliente defina. Los cambios visibles en el microsite deben entrar despues por el flujo oficial de DANA `UPDATE=ACTUALIZAR`.

### Proceso oficial para publicar cambios

Validacion requerida:

Como se procesaran las actualizaciones solicitadas por el asesor antes de reflejarse en el microsite.

Por que importa:

El microsite puede capturar una solicitud de cambio, pero no debe modificar directamente el dato productivo sin pasar por el sistema oficial de Mercantil/DANA. Hay que definir donde se recibe, valida y aprueba esa informacion.

Propuesta actual:

Manejar una de estas dos opciones:

1. Crear una lista de contactos en DANA para solicitudes de actualizacion del asesor.
   Ahi se guardan los datos propuestos, la evidencia y el estado de revision. Luego un flujo aprobado actualiza la lista principal `Microsite_asesores` y ejecuta el nodo API `UPDATE=ACTUALIZAR`.

2. Consumir un servicio de Mercantil/banco para enviar la solicitud al sistema oficial donde viven los datos del asesor.
   Cuando ese sistema confirme o aplique el cambio, DANA actualiza la lista principal y ejecuta el nodo API hacia la Lambda.

Regla propuesta:

El microsite solo registra la solicitud. El dato visible en produccion cambia cuando la fuente oficial actualiza DANA y el flujo `UPDATE=ACTUALIZAR` sincroniza DynamoDB.

## Seguridad y auditoria

### Retencion de eventos operativos

Validacion requerida:

Si el proyecto debe guardar historico de eventos operativos, y por cuanto tiempo.

Eventos posibles:

- Solicitudes de cotizacion.
- Solicitudes de actualizacion de datos.
- Desactivaciones de microsites.
- Respuestas de los nodos API de DANA.
- Clicks en cotizadores, si cliente decide medirlos desde este sistema.

Por que importa:

Si se requiere auditoria, reclamos o trazabilidad, estos eventos deben conservarse. Si no se requieren, guardar menos informacion reduce costos y exposicion de datos.

Propuesta actual:

Guardar solo lo necesario para operar el flujo actual y conservar el snapshot del asesor en DynamoDB. No aplicar borrado automatico hasta que cliente/auditoria defina una politica formal de retencion.
