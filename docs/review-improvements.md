# Plan: Mejoras post-review para Billy takehome

## Context

Un reviewer principal evaluó el proyecto Billy con el rubric de una Silicon Valley startup. Dio feedback con dos "critical issues" — uno es un falso positivo (SQL injection en Drizzle ORM, que usa parámetros preparados), y el otro es válido (error handling en services). Además, hay mejoras de código reales que elevan el score pero el reviewer no marcó explícitamente.

El objetivo es subir el score de "Yes" a "Strong yes" corrigiendo issues reales y fortaleciendo las áreas débiles.

---

## Issues a corregir

### 1. Error handling en `services/bills.ts` (issue VÁLIDO del reviewer)

**Problema**: Axios lanza excepciones en 4xx/5xx automáticamente, pero los services no extraen el mensaje del body `{ error: "..." }`. Los hooks reciben un `AxiosError` genérico. Los componentes no pueden mostrar el error del servidor al usuario.

**Fix**: Agregar un interceptor de respuesta en `lib/api.ts` que extraiga `response.data.error` y lo re-lance como un error con mensaje legible. Así los hooks y componentes ven el mensaje real del servidor sin cambiar la firma de ninguna función.

```ts
// lib/api.ts — agregar después de crear la instancia:
api.interceptors.response.use(
  (response) => response,
  (error: ApiError) => {
    const message = error.response?.data?.error ?? error.message;
    return Promise.reject(Object.assign(error, { message }));
  }
);
```

### 2. `BillActions` no muestra feedback de error al usuario

**Problema**: Si approve/reject falla (ej: 400 "Bill cannot be approved in current status"), los botones se re-habilitan pero el usuario no ve ningún mensaje. `isError` y `error` del hook se ignoran completamente en el componente.

**Fix**: Mostrar un `<p>` con `error.message` debajo de los botones cuando `isError === true`.

**Archivo**: `components/bills/BillActions.tsx`

### 3. Race condition sutil en `PATCH /api/bills/:id` (approve)

**Problema**: Después del `db.transaction()` para approve, se hace una segunda query separada para fetch el bill actualizado. Si hay un fallo entre ambas (poco probable pero posible), el response muestra datos del estado anterior.

**Fix**: Refetch el bill dentro de la transacción usando `tx.query.bills.findFirst(...)` al final del bloque de transacción y retornarlo directamente. Esto garantiza consistencia.

**Archivo**: `app/api/bills/[id]/route.ts`, líneas 85-117.

### 4. Tests de hooks con React Query Testing Library

**Problema**: `useBillActionMutation`, `useBillsQuery`, `useBillQuery` no tienen tests. El reviewer valoró la suite de tests pero solo hay 2 archivos. Agregar tests de hooks sube el score considerablemente.

**Fix**: Crear `hooks/useBillActionMutation/useBillActionMutation.test.ts` cubriendo:

- mutación exitosa → invalida queryKeys correctas
- mutación fallida → propaga el error

**Nota**: Usar `renderHook` + `QueryClientWrapper` de `@testing-library/react`. Los services se mockean con `vi.mock`.

---

## Archivos a modificar

| Archivo                                                     | Cambio                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `lib/api.ts`                                                | Agregar response interceptor que extrae `error.message` del body |
| `components/bills/BillActions.tsx`                          | Mostrar mensaje de error cuando `isError === true`               |
| `app/api/bills/[id]/route.ts`                               | Refetch dentro de la transacción en approve                      |
| `hooks/useBillActionMutation/useBillActionMutation.test.ts` | Nuevo archivo de tests                                           |

---

## Lo que NO vamos a cambiar

- `lib/auth.ts`: El reviewer lo marcó como SQL injection pero es un **falso positivo**. Drizzle ORM usa parámetros preparados. No tocar.
- `services/bills.ts`: No se cambia la firma — el fix va en el interceptor de `lib/api.ts`.

---

## Verificación

1. `pnpm typecheck` — sin errores TypeScript
2. `pnpm test` — todos los tests existentes pasan + nuevos tests del hook pasan
3. Probar manualmente: intentar aprobar un bill que no está en `awaiting_approval` → debe mostrarse el mensaje de error del servidor en la UI
4. Probar aprobación exitosa → payment aparece en el detail sin refresh manual
