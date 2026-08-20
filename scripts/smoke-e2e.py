#!/usr/bin/env python3
"""
Prueba integral (end-to-end) contra la API REAL de DOZZIER (DESA).

Reproduce EXACTAMENTE los requests que hace la app en los flujos criticos, para
detectar fallos de contrato/negocio antes de compilar el APK (el emulador no
alcanza la API por la VPN, asi que esta es la red de seguridad).

Uso (PowerShell):
    $env:SMOKE_USER="aalvarado"; $env:SMOKE_PASS="****"; python scripts/smoke-e2e.py
Uso (bash):
    SMOKE_USER=aalvarado SMOKE_PASS=**** python scripts/smoke-e2e.py

Variables opcionales: SMOKE_BASE (default DESA), SMOKE_DOMINIO (default "desa").
Sale con codigo 0 si todo pasa; 1 si hay algun fallo relevante para la app.
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("SMOKE_BASE", "https://desa.dozzier.net/HelpDesk.Api")
USER = os.environ.get("SMOKE_USER")
PWD = os.environ.get("SMOKE_PASS")
DOMINIO = os.environ.get("SMOKE_DOMINIO", "desa")

if not USER or not PWD:
    print("Falta SMOKE_USER / SMOKE_PASS en el entorno.")
    sys.exit(2)


def call(path, method="GET", token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8", "replace"))
        except Exception:
            return e.code, {}
    except Exception as e:  # noqa: BLE001
        return -1, {"err": str(e)}


PASS, FAIL = [], []


def check(cond, name, extra=""):
    (PASS if cond else FAIL).append(name)
    print(("  OK  " if cond else "  XX  ") + name + (("  " + extra) if extra else ""))


print("== 1) LOGIN ==")
st, r = call("/api/Auth/login", "POST", body={"nombreUsuario": USER, "password": PWD, "dominio": DOMINIO})
tok = (r.get("datos") or {}).get("token")
check(st == 200 and bool(tok), "login devuelve token")
if not tok:
    sys.exit(1)

print("== 2) CREAR CASO ==")
st, r = call("/api/Case", "POST", token=tok, body={
    "equipmentTypeId": 2, "serviceTypeId": 1, "caseDetails": "E2E smoke test",
    "userRequester": USER, "emailRequester": "a@a.com", "countryId": 1, "departmentId": 8})
cid = (r.get("datos") or {}).get("id")
check(st == 201 and bool(cid), "POST /api/Case -> 201", f"id={cid}")


def detail():
    _, rr = call(f"/api/Case/{cid}", token=tok)
    return rr.get("datos") or {}


check(detail().get("userRequester") == USER, "userRequester del caso = usuario login")

print("== 3) APARECE EN LA LISTA ==")
_, r = call("/api/Case?numeroPagina=1&tamanoPagina=50", token=tok)
items = ((r.get("datos") or {}).get("items")) or []
check(any(it.get("id") == cid for it in items), "el caso nuevo aparece en GET /api/Case")

print("== 4) COMENTARIO con AUTOR ==")
st, _ = call("/api/CasesComment", "POST", token=tok,
             body={"idCase": cid, "comment": "comentario e2e", "isPrivate": False, "statusCaseId": 1, "userRequester": USER})
check(st == 201, "POST comentario -> 201")
_, r = call(f"/api/CasesComment/por-case/{cid}", token=tok)
cms = r.get("datos") or []
check(len(cms) >= 1, "GET por-case trae el comentario")
check(any(c.get("userRequester") == USER for c in cms), "el comentario guarda el autor correcto")

print("== 5) CAMBIO DE ESTADO a los 6 estados (regla classificationCaseId == statusCaseId) ==")
NAMES = {1: "En espera", 2: "Devolver a cola", 3: "Resuelto", 4: "Cerrado", 5: "AIG", 6: "Cliente"}
for s in [2, 3, 4, 5, 6, 1]:
    st, _ = call(f"/api/Case/{cid}", "PUT", token=tok,
                 body={"id": cid, "userRequester": USER, "statusCaseId": s, "classificationCaseId": s})
    now = detail().get("statusCaseId")
    check(st == 200 and now == s, f"estado -> {s} ({NAMES[s]})", f"quedo={now}")

print("== 6) REASIGNAR (PUT completo) ==")
st, _ = call(f"/api/Case/{cid}", "PUT", token=tok, body={
    "id": cid, "userRequester": USER, "statusCaseId": 3, "classificationCaseId": 3,
    "priorityId": 2, "serviceTypeId": 1, "equipmentTypeId": 2, "technician": "analista1",
    "location": "E2E", "caseDetails": "E2E smoke test", "subStatusCaseId": 1})
d = detail()
check(st == 200 and d.get("technician") == "analista1" and d.get("statusCaseId") == 3, "reasignar tecnico+estado")

print("== 7) LIMPIEZA (best-effort; DELETE del backend puede dar 500) ==")
st, _ = call(f"/api/Case/{cid}", "DELETE", token=tok)
if st != 200:
    print(f"  (aviso) no se pudo borrar el caso de prueba {cid} (DELETE -> {st}); es limitacion del backend")

print(f"\n=== RESULTADO: {len(PASS)} OK, {len(FAIL)} FALLOS ===")
if FAIL:
    print("FALLARON:")
    for f in FAIL:
        print("  -", f)
    sys.exit(1)
print("Todos los flujos de la app OK.")
