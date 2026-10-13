import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CustodyItem } from "@/lib/custody-term";

const styles = StyleSheet.create({
  page: {
    paddingTop: "1.27cm",
    paddingBottom: "1.27cm",
    paddingLeft: "1.27cm",
    paddingRight: "1.27cm",
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  logo: { width: 110, alignSelf: "center" },
  headerRule: { marginTop: 8, height: 1, backgroundColor: "#0f172a" },
  title: { marginTop: 14, fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center" },
  body: { marginTop: 16 },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  info: { width: "100%", borderWidth: 0.5, borderColor: "#cbd5e1" },
  infoRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  infoRowLast: { flexDirection: "row" },
  infoLabel: {
    width: 90,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#475569",
  },
  infoValue: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 10 },
  table: { marginTop: 4, width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  head: { backgroundColor: "#f8fafc", borderBottomColor: "#cbd5e1" },
  cell: { paddingVertical: 5, paddingHorizontal: 4 },
  headText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#475569" },
  note: { marginTop: 2, fontSize: 8, color: "#64748b" },
  sign: { marginTop: 48, alignItems: "center" },
  line: { marginTop: 36, width: 240, borderBottomWidth: 0.8, borderBottomColor: "#0f172a" },
  signName: { marginTop: 6, fontFamily: "Helvetica-Bold" },
  signMeta: { marginTop: 2, fontSize: 9, color: "#475569" },
});

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? styles.infoRowLast : styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function CustodyTermPdf({
  usuario,
  matricula,
  setor,
  predio,
  dateLabel,
  items,
  logoSrc,
}: {
  usuario: string;
  matricula: string;
  setor: string;
  predio: string;
  dateLabel: string;
  items: CustodyItem[];
  logoSrc: string;
}) {
  const who = usuario === "—" ? "o usuário responsável" : usuario;
  const groupLabel = items.length > 1 ? "Dados do agrupamento" : "Dados do equipamento";

  return (
    <Document title="Termo de Recebimento">
      <Page size="A4" style={styles.page}>
        {/* @react-pdf/renderer Image — not a DOM <img>; no alt prop */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={logoSrc} style={styles.logo} />
        <View style={styles.headerRule} />
        <Text style={styles.title}>Termo de Recebimento</Text>
        <Text style={styles.body}>
          Eu, {who}, declaro que recebi o(s) equipamento(s) relacionado(s) abaixo e confirmo a posse para guarda e uso.
        </Text>

        <Text style={styles.sectionLabel}>{groupLabel}</Text>
        <View style={styles.info}>
          <InfoRow label="Usuário" value={usuario} />
          <InfoRow label="Matrícula" value={matricula === "—" ? "—" : matricula} />
          <InfoRow label="Setor" value={setor} />
          <InfoRow label="Prédio" value={predio} last />
        </View>

        <Text style={styles.sectionLabel}>Equipamento{items.length > 1 ? "s" : ""}</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            {["Tipo", "Patrimônio", "Modelo", "S/N"].map((label) => (
              <View key={label} style={[styles.cell, { flex: label === "Modelo" ? 2 : 1 }]}>
                <Text style={styles.headText}>{label}</Text>
              </View>
            ))}
          </View>
          {items.map((item) => (
            <View key={item.tombo} wrap={false}>
              <View style={styles.row}>
                <View style={[styles.cell, { flex: 1 }]}><Text>{item.tipo}</Text></View>
                <View style={[styles.cell, { flex: 1 }]}><Text>{item.tombo}</Text></View>
                <View style={[styles.cell, { flex: 2 }]}><Text>{item.modelo}</Text></View>
                <View style={[styles.cell, { flex: 1 }]}><Text>{item.serialNumber}</Text></View>
              </View>
              {item.observacoes && (item.tipo === "Computador" || item.tipo === "Notebook") ? (
                <View style={[styles.row, { paddingBottom: 4 }]}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.note}>Observação: {item.observacoes}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.sign}>
          <Text>Belém, {dateLabel}</Text>
          <View style={styles.line} />
          <Text style={styles.signName}>{usuario}</Text>
          <Text style={styles.signMeta}>{matricula === "—" ? "Matrícula" : `Matrícula ${matricula}`}</Text>
        </View>
      </Page>
    </Document>
  );
}
