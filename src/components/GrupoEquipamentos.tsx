"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { agruparEquipamentos, desagruparEquipamento, desagruparTudo } from "@/app/actions/grupos";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { memberHref, memberLabel, type AssetRef, type GroupMember } from "@/lib/equipamento-grupo";

type Candidate = {
  kind: "COMPUTER" | "MONITOR";
  id: string;
  tombo: string;
  usuario: string | null;
  groupId: string | null;
};

export function GrupoEquipamentos({
  current,
  members,
  candidates,
  canOperate = true,
}: {
  current: AssetRef & { tombo: string };
  members: Array<Omit<GroupMember, "deletedAt">>;
  candidates: Candidate[];
  canOperate?: boolean;
}) {
  const router = useRouter();
  const grouped = members.length >= 2;
  const [agruparOpen, setAgruparOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [ungroupAllOpen, setUngroupAllOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pick, setPick] = useState("");
  const [referenceKey, setReferenceKey] = useState(`${current.kind}:${current.id}`);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmAlloc, setConfirmAlloc] = useState(false);

  const optionMap = useMemo(
    () => new Map(candidates.map((item) => [`${item.kind}:${item.id}`, item])),
    [candidates],
  );

  const pickerOptions = candidates
    .filter((item) => !(item.kind === current.kind && item.id === current.id))
    .filter((item) => !selected.includes(`${item.kind}:${item.id}`))
    .map((item) => ({
      id: `${item.kind}:${item.id}`,
      label: `${memberLabel(item)}${item.usuario ? ` — ${item.usuario}` : ""}${item.groupId ? " (agrupado)" : ""}`,
    }));

  function addPicked(value: string) {
    if (!value) return;
    setSelected((currentSelected) => [...currentSelected, value]);
    setPick("");
  }

  async function submitGroup(confirmed = false) {
    setPending(true);
    setError("");
    const [referenceKind, referenceId] = referenceKey.split(":");
    const allKeys = [...new Set([`${current.kind}:${current.id}`, ...selected])];
    const others = allKeys.filter((item) => item !== referenceKey);
    const fd = new FormData();
    fd.set("referenceKind", referenceKind);
    fd.set("referenceId", referenceId);
    fd.set("others", others.join(","));
    if (confirmed) fd.set("confirmouAlocacao", "1");
    const res = await agruparEquipamentos(null, fd);
    setPending(false);
    if (res.error) {
      if (res.error.includes("será substituída") && !confirmed) {
        setConfirmAlloc(true);
        setError(res.error);
        return;
      }
      setError(res.error);
      return;
    }
    setAgruparOpen(false);
    setConfirmAlloc(false);
    setSelected([]);
    router.refresh();
  }

  async function runSimple(action: typeof desagruparEquipamento | typeof desagruparTudo) {
    setPending(true);
    setError("");
    const fd = new FormData();
    fd.set("kind", current.kind);
    fd.set("id", current.id);
    const res = await action(null, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRemoveOpen(false);
    setUngroupAllOpen(false);
    router.refresh();
  }

  return (
    <section id="agrupamento" className="surface p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">Equipamentos agrupados</h2>
        {canOperate ? <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => { setError(""); setAgruparOpen(true); }}>
            {grouped ? "Adicionar ao grupo" : "Agrupar equipamentos"}
          </Button>
          {grouped ? (
            <>
              <Button type="button" variant="secondary" onClick={() => { setError(""); setRemoveOpen(true); }}>
                Desagrupar este equipamento
              </Button>
              <Button type="button" variant="danger" onClick={() => { setError(""); setUngroupAllOpen(true); }}>
                Desagrupar tudo
              </Button>
            </>
          ) : null}
        </div> : null}
      </div>

      {grouped ? (
        <ul className="divide-y divide-line">
          {members.map((member) => {
            const isCurrent = member.kind === current.kind && member.id === current.id;
            return (
              <li key={`${member.kind}-${member.id}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                {isCurrent ? (
                  <span className="font-medium text-slate-900">{memberLabel(member)}</span>
                ) : (
                  <Link href={memberHref(member)} className="font-medium text-brand hover:underline">
                    {memberLabel(member)}
                  </Link>
                )}
                <StatusBadge status={member.status} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Este equipamento não está agrupado.</p>
      )}

      <Dialog title={grouped ? "Adicionar ao agrupamento" : "Agrupar equipamentos"} open={agruparOpen} onClose={() => setAgruparOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Escolha os equipamentos e a referência. Usuário, setor, prédio e status da referência serão copiados para os demais.
          </p>
          <Field label="Adicionar equipamento">
            <SearchSelect
              key={selected.join("|")}
              value={pick}
              onChange={addPicked}
              allowEmpty={false}
              emptyLabel="Selecionar…"
              placeholder="Pesquisar patrimônio…"
              options={pickerOptions}
            />
          </Field>
          {selected.length ? (
            <ul className="space-y-1 text-sm">
              {selected.map((key) => {
                const item = optionMap.get(key);
                return (
                  <li key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span>{item ? memberLabel(item) : key}</span>
                    <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={() => setSelected((rows) => rows.filter((row) => row !== key))}>
                      Remover
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <Field label="Equipamento de referência">
            <select
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
              value={referenceKey}
              onChange={(event) => setReferenceKey(event.target.value)}
            >
              <option value={`${current.kind}:${current.id}`}>{memberLabel(current)}</option>
              {selected.map((key) => {
                const item = optionMap.get(key);
                return (
                  <option key={key} value={key}>
                    {item ? memberLabel(item) : key}
                  </option>
                );
              })}
            </select>
          </Field>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAgruparOpen(false)}>Cancelar</Button>
            <Button type="button" disabled={pending || !selected.length} onClick={() => void submitGroup(confirmAlloc)}>
              {pending ? "Salvando…" : confirmAlloc ? "Confirmar alocação e agrupar" : "Agrupar"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog title="Desagrupar este equipamento" open={removeOpen} onClose={() => setRemoveOpen(false)}>
        <p className="mb-4 text-sm text-slate-600">
          {memberLabel(current)} sai do agrupamento e mantém usuário, setor, prédio e status atuais. Os demais permanecem agrupados.
        </p>
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoveOpen(false)}>Cancelar</Button>
          <Button type="button" disabled={pending} onClick={() => void runSimple(desagruparEquipamento)}>
            {pending ? "Salvando…" : "Desagrupar"}
          </Button>
        </div>
      </Dialog>

      <Dialog title="Desagrupar tudo" open={ungroupAllOpen} onClose={() => setUngroupAllOpen(false)}>
        <p className="mb-4 text-sm text-slate-600">
          Remove o vínculo entre todos os equipamentos. Ninguém perde usuário, setor, prédio ou status.
        </p>
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setUngroupAllOpen(false)}>Cancelar</Button>
          <Button type="button" variant="danger" disabled={pending} onClick={() => void runSimple(desagruparTudo)}>
            {pending ? "Salvando…" : "Desagrupar tudo"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
