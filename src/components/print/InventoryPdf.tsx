import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type PdfLine = { text: string; note?: string };
export type PdfCell = string | { lines: PdfLine[] };
export type PdfColumn = { id: string; label: string };

const styles = StyleSheet.create({
  page: {
    paddingTop: "1.27cm",
    paddingBottom: "1.27cm",
    paddingLeft: "1.27cm",
    paddingRight: "1.27cm",
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: { marginBottom: 12 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  meta: { marginTop: 4, fontSize: 8, color: "#64748b" },
  table: { width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  head: { backgroundColor: "#f8fafc", borderBottomColor: "#cbd5e1" },
  cell: { flex: 1, paddingVertical: 4, paddingHorizontal: 4 },
  headText: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#475569" },
  note: { marginTop: 1, fontSize: 6, color: "#94a3b8" },
});

function CellValue({ value }: { value: PdfCell }) {
  if (typeof value === "string") return <Text>{value}</Text>;
  return (
    <View>
      {value.lines.map((line, index) => (
        <View key={`${line.text}-${index}`} style={index > 0 ? { marginTop: 3 } : undefined}>
          <Text>{line.text}</Text>
          {line.note ? <Text style={styles.note}>{line.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function InventoryPdf({
  title,
  generatedAt,
  columns,
  rows,
}: {
  title: string;
  generatedAt: string;
  columns: PdfColumn[];
  rows: Array<Record<string, PdfCell>>;
}) {
  return (
    <Document title={title}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{generatedAt} · {rows.length} {rows.length === 1 ? "registro" : "registros"}</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]} fixed>
            {columns.map((column) => (
              <View key={column.id} style={styles.cell}>
                <Text style={styles.headText}>{column.label}</Text>
              </View>
            ))}
          </View>
          {rows.map((row, index) => (
            <View key={index} style={styles.row} wrap={false}>
              {columns.map((column) => (
                <View key={column.id} style={styles.cell}>
                  <CellValue value={row[column.id] ?? "—"} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
