# Respuestas para reunion - Microsite de asesores

Documento de apoyo para reunion sobre el microsite de asesores de Mercantil Seguros.

## Resumen ejecutivo

El microsite funciona como un perfil publico controlado para asesores. No reemplaza el portal de asesores ni requiere login, porque su objetivo es permitir que cada asesor tenga un enlace permanente para compartir su perfil, canales de contacto y cotizadores habilitados.

DANAconnect es el centro operativo del flujo. La lista de contactos en DANA contiene la informacion del asesor, los productos/cotizadores habilitados y las URLs de cada cotizador. Los flujos de DANA ejecutan nodos API hacia la Lambda para generar, actualizar o desactivar el microsite. La Lambda guarda un snapshot en DynamoDB para que el enlace cargue rapido y funcione en cualquier navegador.

La URL publica no expone el `ADVISORID` real ni el `MICROSITEID` interno. Se usa un `PUBLICID` enmascarado y no secuencial, lo que evita que un asesor pueda deducir enlaces de otros asesores a partir de codigos internos.

## Preguntas iniciales del cliente y respuesta propuesta

### 1. Tiene costo adicional o forma parte de la plataforma de DANA como los formularios?

Respuesta propuesta:

El microsite no es simplemente un formulario. La solucion combina DANAconnect, AWS Lambda, DynamoDB y el frontend publicado en Amplify. DANA queda como fuente operativa de datos y orquestador de flujos; la Lambda sincroniza y normaliza la informacion; DynamoDB permite que el enlace permanente cargue de forma estable.

Punto a validar comercialmente:

El costo debe separarse entre configuracion/implementacion del modulo, infraestructura y operacion/evolutivos. La parte tecnica ya permite masificar el uso por segmento de asesores sin construir un microsite manual por cada asesor.

### 2. Es una plantilla fija para todos los ADS o cada uno puede tener productos especificos?

Respuesta propuesta:

Es una plantilla comun, pero el contenido es personalizado por asesor.

Cada asesor puede tener productos/cotizadores distintos segun lo que venga configurado en DANA:

```text
COTIZADOR_AUTO = SI/NO
COTIZADOR_SALUD = SI/NO
COTIZADOR_VITALES = SI/NO
...
```

Ademas, cada cotizador habilitado debe tener su URL especifica por asesor:

```text
COTIZADOR_AUTO_URL
COTIZADOR_SALUD_URL
COTIZADOR_VITALES_URL
...
```

Regla aplicada:

Si un cotizador esta en `SI` pero no tiene URL, no se muestra en el frontend. Esto evita botones incompletos o experiencias rotas.

### 3. Si luego se desea agregar o desincorporar un producto, hay que hacerlo uno por uno o se puede aplicar de forma masiva?

Respuesta propuesta:

Para el alcance actual, la operacion se controla desde DANA. Se puede actualizar la lista de contactos y ejecutar el flujo de actualizacion para sincronizar DynamoDB.

Para agregar o quitar productos a asesores existentes:

- Se actualizan las banderas `COTIZADOR_*`.
- Se actualizan las URLs `COTIZADOR_*_URL` cuando aplique.
- DANA ejecuta el nodo API de actualizacion.
- La Lambda actualiza el snapshot del asesor.

Al estar dirigido a un segmento definido de asesores, este modelo es suficiente y controlado. Si en el futuro se agrega un producto completamente nuevo a la solucion, se trataria como cambio evolutivo: crear campos en DANA, ajustar nodos API, actualizar Lambda/frontend y validar el flujo.

### 4. Los enlaces personalizados a cada experiencia de los ADS se configuran manualmente o se puede llamar a un API para generarlos?

Respuesta propuesta:

Si, se puede llamar a un API para generarlos o actualizarlos.

DANA puede actuar como orquestador: desde un flujo puede ejecutar nodos API, consumir un servicio del banco o de Mercantil que entregue los enlaces personalizados y guardar esos valores en la lista de contactos del asesor.

Para el microsite, el enlace permanente se genera automaticamente desde la Lambda y se devuelve a DANA:

```text
MICROSITEID
MICROSITEURL
```

DANA guarda esos valores con un nodo Update y luego el correo al asesor usa `MICROSITEURL`.

Para los cotizadores, las URLs tambien pueden venir de un API externo. El resultado esperado es que DANA guarde por asesor los campos:

```text
COTIZADOR_AUTO_URL
COTIZADOR_SALUD_URL
COTIZADOR_VITALES_URL
...
```

Con ese modelo, DANA sigue siendo el punto de control operativo: puede recibir o recalcular enlaces desde otro flujo/API, actualizar la lista de contactos y luego sincronizar el microsite sin modificar manualmente el frontend.

### 5. El diseno del landing puede ser ajustado por comunicaciones para actualizar identidad de marca?

Respuesta propuesta:

Si. El frontend esta construido como una plantilla visual unica que puede ajustarse a lineamientos de marca. Los cambios de look & feel se hacen en el proyecto frontend y se despliegan en Amplify.

Alcance actual:

- Logos y colores alineados al microsite actual.
- Tarjeta del asesor.
- Catalogo de cotizadores.
- Mensajes de estado activo/inactivo.
- Correo de acceso permanente con imagenes y estilo del microsite.

## Seguridad y controles aplicados

### Microsite sin login

El microsite sera sin login por decision funcional del cliente. Esto evita duplicar el portal actual de asesores.

Control aplicado:

La URL no expone identificadores reales. El enlace usa un `PUBLICID` enmascarado/no secuencial. Esto protege contra el riesgo de que alguien deduzca enlaces probando codigos internos o secuenciales.

### Identificadores

```text
ADVISORID
```

Identificador unico del asesor provisto por Mercantil Seguros. No se usa en la URL publica.

```text
MICROSITEID
```

Identificador interno del microsite. Se guarda en DANA, pero no se expone directamente en la URL publica.

```text
PUBLICID
```

Identificador publico enmascarado usado en:

```text
/asesor/{PUBLICID}
```

### Baja o desactivacion

La baja se maneja con el flujo de DANA:

```text
UPDATE = DESACTIVAR
MICROSITEACTIVADO = NO
```

La Lambda marca el microsite como inactivo en DynamoDB. El enlace puede seguir existiendo, pero el frontend no debe mostrar la informacion operativa del asesor.

### Seguridad pendiente recomendada

Para endurecer el backend productivo, se recomienda proteger los POST administrativos de DANA hacia la Lambda con un header secreto o API key.

Esto aplicaria a:

```text
advisor_sync generar
advisor_sync actualizar
advisor_sync desactivar
```

No cambia la experiencia del asesor ni el enlace publico. Solo evita que alguien fuera de DANA intente ejecutar operaciones administrativas contra la Lambda.

## Flujo operativo validado

### Generar microsite

Condicion en DANA:

```text
MICROSITEACTIVADO vacio
UPDATE vacio
```

Accion:

DANA ejecuta POST generar hacia la Lambda.

Resultado:

La Lambda genera `MICROSITEID`, genera `MICROSITEURL`, guarda DynamoDB y responde campos planos.

DANA guarda:

```text
MICROSITEID
MICROSITEURL
MICROSITEACTIVADO = SI
UPDATE = GENERADO
RESPONSE_MICROSITE
```

### Actualizar microsite

Condicion en DANA:

```text
MICROSITEACTIVADO = SI
UPDATE = ACTUALIZAR
```

Accion:

DANA ejecuta POST actualizar hacia la Lambda con la informacion vigente.

Resultado:

La Lambda actualiza DynamoDB y conserva el mismo enlace permanente.

DANA guarda:

```text
MICROSITEACTIVADO = SI
UPDATE = ACTUALIZADO
RESPONSE_MICROSITE
```

Nota:

En actualizacion no se reescriben `MICROSITEID` ni `MICROSITEURL`; solo se usan como referencia y confirmacion.

### Desactivar microsite

Condicion en DANA:

```text
MICROSITEACTIVADO = SI
UPDATE = DESACTIVAR
```

Accion:

DANA ejecuta POST desactivar hacia la Lambda.

Resultado:

La Lambda marca el registro como inactivo.

DANA guarda:

```text
MICROSITEACTIVADO = NO
UPDATE = DESACTIVADO
RESPONSE_MICROSITE
```

## Registro de clicks en cotizadores

Objetivo:

DANA debe conservar la medicion de clicks por asesor y producto para reportes y dashboards.

Modelo preparado:

El frontend abre la URL del cotizador y, en paralelo, avisa a la Lambda. La Lambda envia el evento a DANA mediante Conversation API `start/data`.

Campos definidos para la lista/flujo de clicks:

```text
FECHA
ADVISORID
MICROSITEID
MICROSITEURL
NOMBREASESOR
EMAILASESOR
PRODUCTO
COTIZADOR_URL
USER_AGENT
```

La fecha puede quedar alimentada por un nodo Update de DANA.

Regla:

Los clicks no se guardan en DynamoDB. DynamoDB queda reservado para el snapshot operativo del microsite. DANA queda como repositorio operativo para analitica de clicks.

## Preguntas que pueden surgir y respuesta sugerida

### Los datos quedan expuestos por no tener login?

Respuesta:

El microsite es publico por decision funcional, como una tarjeta digital o perfil comercial del asesor. El control aplicado es que la URL no expone codigos reales ni secuenciales. Si un asesor comparte su enlace, cualquiera con ese enlace puede abrirlo, que es parte del objetivo comercial del microsite.

### Un asesor puede entrar al microsite de otro asesor?

Respuesta:

Solo si tiene el enlace publico de ese asesor. No puede deducirlo probando `ADVISORID` porque el enlace usa un `PUBLICID` enmascarado y no secuencial.

### Que pasa si un asesor es dado de baja?

Respuesta:

DANA ejecuta el flujo de desactivacion. La Lambda marca el microsite como inactivo en DynamoDB y el frontend muestra estado inactivo en vez de mostrar la informacion comercial.

### Donde se actualiza la informacion del asesor?

Respuesta:

La informacion productiva se actualiza en DANA. Luego DANA ejecuta el nodo API de actualizacion hacia la Lambda para refrescar el snapshot en DynamoDB.

### El asesor puede modificar su informacion desde el microsite?

Respuesta:

Puede solicitar actualizacion de datos de contacto/perfil, pero el dato productivo no cambia automaticamente. Debe pasar por el proceso oficial definido por Mercantil/DANA.

### Que sucede si se reactiva un asesor desactivado?

Respuesta:

Debe validarse como regla operativa. Tecnicamente puede reactivarse con el flujo de actualizacion, conservando el mismo `MICROSITEID` y la misma `MICROSITEURL`.

### Que pasa si se agrega un producto nuevo?

Respuesta:

Para el alcance actual, un producto nuevo se maneja como cambio controlado. Se crean campos en DANA, se ajustan nodos API, se actualiza Lambda/frontend y se valida el flujo. No se espera que sea una operacion frecuente por tratarse de productos de seguros.

### Que queda recomendado como mejora de seguridad?

Respuesta:

Proteger los POST administrativos con un header secreto/API key desde DANA, restringir CORS al dominio del microsite, configurar headers de seguridad en Amplify/CloudFront y evaluar rate limiting/WAF como hardening de produccion.

## Cierre sugerido para la reunion

El modelo actual resuelve el flujo principal del cliente:

- Cada asesor tiene un enlace permanente.
- La URL no expone identificadores internos.
- DANA controla los datos, productos, URLs de cotizadores y estados.
- El microsite carga rapido desde DynamoDB.
- DANA puede generar, actualizar y desactivar microsites por flujo.
- Los clicks de cotizadores pueden registrarse en DANA para analitica.

Las siguientes decisiones a cerrar son operativas: politica de baja/reactivacion, proceso de aprobacion de cambios de perfil, retencion de eventos y endurecimiento del acceso administrativo a la Lambda.
