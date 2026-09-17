"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { createMonitoresLote, saveMonitor } from "@/app/actions/monitores";
import { CADASTRO_MODE_OPTIONS, LoteConfirmDialog, useLoteCadastro } from "@/components/LoteCadastro";
import { TomboRangeFields } from "@/components/TomboRangeFields";
import { AcquisitionFields } from "@/components/AcquisitionFields";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";

type Option = { id: string; nome?: string; codigo?: string; tombo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; matricula?: string | null };
type ComputerOption = {
  id: string;
  tombo: string;
  usuario: string | null;
  status: AssetStatus;
  departamento: { codigo: string; nome: string } | null;
  localizacao?: { nome: string; cidade?: string | null; uf?: string | null } | null;
};

export function MonitorForm({
  monitor,
  departments,
  locations,
  computers,
  people = [],
  cancelHref,
  onSuccess,
}: {
  monitor?: {
    id: string;
    tombo: string;
    serialNumber: string | null;
    fabricante: string | null;
    modelo: string | null;
    tamanho: string | null;
    resolucao: string | null;
    conexoes: string | null;
    status: AssetStatus;
    observacoes: string | null;
    usuario: string | null;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
    computadorId: string | null;
    dataNotaFiscal?: string | Date | null;
    dataRecebimento?: string | Date | null;
    prazoGarantiaAnos?: number | null;
  };
  departments: Option[];
  locations: Option[];
  computers: ComputerOption[];
  people?: PersonOption[];
  cancelHref?: string;
  onSuccess?: (id?: string) => void;
}) {
  const isCreate = !monitor;
  const {
    mode,
    setMode,
    tomboInicio,
    setTomboInicio,
    tomboFim,
    setTomboFim,
    confirmOpen,
    setConfirmOpen,
    confirmToken,
    formRef,
    lote,
    rangeLabel,
    onSubmit,
    confirm,
    requestConfirm,
  } = useLoteCadastro(isCreate);
  const [computadorId, setComputadorId] = useState(monitor?.computadorId ?? "");
  const linkedComputer = lote ? null : computers.find((item) => item.id === computadorId) ?? null;

  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = lote || fd.get("cadastroModo") === "lote" ? await createMonitoresLote(prev, fd) : await saveMonitor(prev, fd);
    if ("success" in res && res.success) onSuccess?.("id" in res ? res.id : undefined);
    return res;
  }, null);

  return (
    <>
      <form ref={formRef} action={action} onSubmit={onSubmit} className="grid gap-4">
        {monitor ? <input type="hidden" name="id" value={monitor.id} /> : null}
        {lote ? <input type="hidden" name="cadastroModo" value="lote" /> : null}
        {lote && confirmToken ? <input type="hidden" name="loteConfirmado" value="1" /> : null}
        {isCreate ? (
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={CADASTRO_MODE_OPTIONS}
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {lote ? (
            <TomboRangeFields
              start={tomboInicio}
              end={tomboFim}
              onStartChange={setTomboInicio}
              onEndChange={setTomboFim}
            />
          ) : (
            <>
              <Field label="Patrimônio">
                <TextInput name="tombo" required defaultValue={monitor?.tombo} placeholder="000001" />
              </Field>
              <Field label="Nº de série">
                <TextInput name="serialNumber" defaultValue={monitor?.serialNumber ?? ""} />
              </Field>
            </>
          )}
          <Field label="Fabricante">
            <TextInput name="fabricante" defaultValue={monitor?.fabricante ?? ""} placeholder="HP" />
          </Field>
          <Field label="Modelo">
            <TextInput name="modelo" defaultValue={monitor?.modelo ?? ""} placeholder="P24a G4" />
          </Field>
          <Field label="Tamanho">
            <TextInput name="tamanho" defaultValue={monitor?.tamanho ?? ""} placeholder='24"' />
          </Field>
          <Field label="Resolução">
            <TextInput name="resolucao" defaultValue={monitor?.resolucao ?? ""} placeholder="1920x1080" />
          </Field>
          <Field label="Conexões">
            <TextInput name="conexoes" defaultValue={monitor?.conexoes ?? ""} placeholder="HDMI, DP" />
          </Field>
          {linkedComputer ? (
            <input type="hidden" name="status" value={linkedComputer.status} />
          ) : (
            <Field label="Status">
              <SearchSelect
                name="status"
                allowEmpty={false}
                placeholder="Pesquisar status…"
                defaultValue={monitor?.status ?? "AVAILABLE"}
                options={STATUS_OPTIONS}
              />
            </Field>
          )}
        </div>

        {lote ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alocação</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Setor">
                <SearchSelect
                  name="departamentoId"
                  defaultValue={monitor?.departamentoId ?? ""}
                  placeholder="Pesquisar setor…"
                  options={departments.map((item) => ({
                    id: item.id,
                    label: item.codigo ? `${item.codigo}. ${item.nome}` : item.nome ?? "",
                  }))}
                />
              </Field>
              <Field label="Prédio">
                <SearchSelect
                  name="localizacaoId"
                  defaultValue={monitor?.localizacaoId ?? ""}
                  placeholder="Pesquisar prédio…"
                  options={locations.map((item) => ({
                    id: item.id,
                    label: formatPredio({ nome: item.nome ?? "", cidade: item.cidade, uf: item.uf }),
                  }))}
                />
              </Field>
              <Field label="Usuário" hint="opcional">
                <SearchSelect
                  name="servidorId"
                  defaultValue={monitor?.servidorId ?? ""}
                  emptyLabel="Nenhum"
                  placeholder="Pesquisar usuário…"
                  options={people.map((person) => ({
                    id: person.id,
                    label: person.matricula ? `${person.nome} — ${person.matricula}` : person.nome,
                  }))}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mover para</p>
            <Field label="Computador" hint="ao associar, o monitor copia usuário, setor, prédio e status">
              <SearchSelect
                name="computadorId"
                value={computadorId}
                onChange={setComputadorId}
                emptyLabel="Nenhum — alocar só a um setor"
                placeholder="Pesquisar computador…"
                options={computers.map((item) => ({
                  id: item.id,
                  label: item.usuario ? `${item.tombo} — ${item.usuario}` : item.tombo,
                }))}
              />
            </Field>
            {linkedComputer ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Este monitor ficará com o usuário <span className="font-medium text-slate-900">{linkedComputer.usuario || "não informado"}</span>
                {", o setor "}
                <span className="font-medium text-slate-900">{setorLabel(linkedComputer.departamento) || "não informado"}</span>
                {", o prédio "}
                <span className="font-medium text-slate-900">{formatPredio(linkedComputer.localizacao) || "não informado"}</span>
                {" e o status "}
                <span className="font-medium text-slate-900">{statusLabel(linkedComputer.status)}</span> deste computador.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Setor" hint="quando não estiver em um computador">
                  <SearchSelect
                    name="departamentoId"
                    defaultValue={monitor?.departamentoId ?? ""}
                    placeholder="Pesquisar setor…"
                    options={departments.map((item) => ({
                      id: item.id,
                      label: item.codigo ? `${item.codigo}. ${item.nome}` : item.nome ?? "",
                    }))}
                  />
                </Field>
                <Field label="Prédio">
                  <SearchSelect
                    name="localizacaoId"
                    defaultValue={monitor?.localizacaoId ?? ""}
                    placeholder="Pesquisar prédio…"
                    options={locations.map((item) => ({
                      id: item.id,
                      label: formatPredio({ nome: item.nome ?? "", cidade: item.cidade, uf: item.uf }),
                    }))}
                  />
                </Field>
                <Field label="Usuário" hint="opcional">
                  <SearchSelect
                    name="servidorId"
                    defaultValue={monitor?.servidorId ?? ""}
                    emptyLabel="Nenhum"
                    placeholder="Pesquisar usuário…"
                    options={people.map((person) => ({
                      id: person.id,
                      label: person.matricula ? `${person.nome} — ${person.matricula}` : person.nome,
                    }))}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        <AcquisitionFields
          kind="MONITOR"
          values={{
            dataNotaFiscal: monitor?.dataNotaFiscal,
            dataRecebimento: monitor?.dataRecebimento,
            prazoGarantiaAnos: monitor?.prazoGarantiaAnos,
          }}
        />

        <Field label="Observações">
          <TextArea name="observacoes" defaultValue={monitor?.observacoes ?? ""} />
        </Field>
        {state && "error" in state && state.error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
        <div className="flex justify-end gap-2">
          {cancelHref ? (
            <Link href={cancelHref} className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line hover:bg-slate-50">
              Cancelar
            </Link>
          ) : null}
          <Button
            type={lote ? "button" : "submit"}
            disabled={pending}
            onClick={lote ? requestConfirm : undefined}
          >
            {pending ? "Salvando…" : lote ? "Cadastrar lote" : "Salvar"}
          </Button>
        </div>
      </form>
      <LoteConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirm}
        noun="monitores"
        rangeLabel={rangeLabel}
      />
    </>
  );
}
