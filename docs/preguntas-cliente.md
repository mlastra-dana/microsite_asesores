# Preguntas abiertas para cliente/auditoria

Este documento agrupa las decisiones que todavia deben validarse con cliente, negocio, auditoria o areas tecnicas antes de cerrar una version productiva.

La idea no es listar dudas sueltas, sino dejar claro:

- Que se debe decidir.
- Por que importa.
- Cual es la propuesta actual del proyecto, cuando ya tenemos una recomendacion.

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

## Datos y ciclo de vida

### Baja de asesores

Decision a confirmar:

Si un asesor debe salir de servicio, debe pasar obligatoriamente por el flujo `UPDATE=DESACTIVAR` antes de ser eliminado o removido de la lista de DANA.

Por que importa:

DynamoDB conserva el snapshot que usa el enlace permanente. Si alguien borra un asesor de DANA sin ejecutar la desactivacion, el registro podria seguir existiendo en DynamoDB.

Propuesta actual:

La baja debe ser explicita. El flujo de DANA debe ejecutar `advisor_sync` con `action=deactivate`, guardar `micrositeActive=false` en DynamoDB y actualizar `MICROSITEACTIVADO=NO` en DANA.

Impacto:

El enlace permanente sigue existiendo como URL, pero el backend responde que el microsite no esta activo y el frontend muestra el estado inactivo.

### Conservacion historica en DynamoDB

Decision a confirmar:

Si los registros en DynamoDB deben conservarse historicamente aun cuando el asesor sea desactivado.

Por que importa:

Conservar registros permite auditoria y trazabilidad. Borrarlos reduce almacenamiento, pero elimina evidencia operativa de que el microsite existio, fue actualizado o fue inactivado.

Propuesta actual:

Conservar el registro y marcar `micrositeActive=false`, sin borrado automatico.

Impacto:

No se pierde historia y el enlace permanente puede responder de forma controlada como microsite inactivo.

## Cotizadores

### URL por cotizador

Decision a confirmar:

Si cada cotizador habilitado para un asesor tendra una URL propia en DANA.

Por que importa:

Hoy tenemos banderas `SI`/`NO` para saber que productos mostrar. Si ademas cada cotizador tiene un enlace propio, debemos agregar campos de URL por producto y el frontend debe abrir esos enlaces especificos.

Propuesta actual:

Mantener las banderas `COTIZADOR_*` para habilitar o esconder productos, y agregar campos separados para URLs cuando cliente confirme el modelo.

Ejemplo de campos posibles:

```text
COTIZADOR_AUTO_URL
COTIZADOR_SALUD_URL
COTIZADOR_VITALES_URL
```

### Registro de clicks

Decision a confirmar:

Donde se registraran los clicks por cotizador: DANA, Lambda, otro servicio o una combinacion.

Por que importa:

Negocio quiere medir cuantas veces se hace click en cada cotizador. Si el click debe quedar registrado en DANA, probablemente el enlace de cada cotizador debe pasar por un tracking link o un flujo/evento de DANA.

Propuesta actual:

Definir los links de cotizadores dentro de DANA para que DANA pueda registrar el click. Si luego se requiere analitica adicional, la Lambda puede recibir eventos de click, pero eso debe validarse como alcance separado.

Impacto:

Esto define si el frontend abre un link directo de DANA, un link de la Lambda o un link externo del banco.

## Actualizacion de datos del asesor

### Destino de solicitudes de actualizacion

Decision a confirmar:

Si las solicitudes de actualizacion que hace el asesor desde el microsite deben ir a un servicio del banco, a una lista/flujo de DANA o a otro proceso operativo.

Por que importa:

El microsite puede capturar una solicitud, pero la fuente oficial de datos sigue siendo DANA o el sistema que el banco determine. No debemos actualizar datos sensibles directamente sin flujo aprobado.

Propuesta actual:

Registrar la solicitud como evento y enviarla al flujo que cliente defina. Los cambios visibles en el microsite deben entrar despues por el flujo oficial de DANA `UPDATE=ACTUALIZAR`.

### Campos editables

Decision a confirmar:

Que campos puede proponer actualizar el asesor desde el microsite.

Por que importa:

No todos los datos deben ser editables por el asesor. Por ejemplo, `ADVISORID` no debe modificarse desde el microsite porque es identificador unico de Mercantil.

Propuesta actual:

Permitir solo datos de perfil/contacto como telefono, email, ciudad, website, enlace de contacto y bio, sujeto a aprobacion del proceso oficial.

### Aprobacion antes de publicar cambios

Decision a confirmar:

Si una actualizacion solicitada por el asesor requiere aprobacion antes de reflejarse en DANA y DynamoDB.

Por que importa:

Si se publica automaticamente, el microsite podria mostrar informacion no validada. Si requiere aprobacion, hay que definir quien aprueba y donde queda esa evidencia.

Propuesta actual:

El asesor solicita cambios, pero el dato productivo se actualiza solo cuando DANA ejecuta el nodo API de actualizacion hacia la Lambda.

## Seguridad y auditoria

### Retencion de eventos operativos

Decision a confirmar:

Por cuanto tiempo se deben guardar eventos operativos como solicitudes de cotizacion, solicitudes de actualizacion y desactivaciones.

Por que importa:

Esto impacta auditoria, trazabilidad, privacidad y costos de almacenamiento.

Propuesta actual:

Conservar eventos mientras cliente/auditoria define una politica formal de retencion. No aplicar borrado automatico en esta etapa.

### Enlace permanente publico

Decision a confirmar:

Confirmar que el enlace permanente del asesor sera publico, sin login.

Por que importa:

El asesor necesita guardar y compartir su link. Como no hay login, cualquier persona con el enlace puede abrir el microsite.

Control actual:

La URL usa un `PUBLICID` enmascarado y no secuencial. Ese valor no expone ni el `ADVISORID` ni el `MICROSITEID`.

Limite del control:

Esto reduce exposicion del identificador real, pero no equivale a autenticacion. Si cliente necesita acceso privado, habria que agregar otro mecanismo de seguridad.
