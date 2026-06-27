import { Image, View, StyleSheet } from "@react-pdf/renderer";

export const BORDER = "1pt solid #000000";

const styles = StyleSheet.create({
  signatureSlot: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
  },
  signatureLine: {
    borderBottom: BORDER,
    width: "100%",
    marginBottom: 1,
  },
  signatureImage: {
    width: 64,
    height: 20,
    objectFit: "contain",
    marginBottom: -6,
  },
  stampImage: {
    width: 70,
    height: 70,
    objectFit: "contain",
    opacity: 0.85,
    marginVertical: -16,
  },
});

/** Линия для подписи; если подпись загружена — её изображение показывается над линией */
export function SignatureSlot({ signature }: { signature: Buffer | null }) {
  return (
    <View style={styles.signatureSlot}>
      {signature ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, не HTML img: alt не поддерживается
        <Image src={signature} style={styles.signatureImage} />
      ) : null}
      <View style={styles.signatureLine} />
    </View>
  );
}

/** Печать организации рядом с «М.П.» — обычный блок в потоке, без absolute */
export function StampOverlay({ stamp }: { stamp: Buffer | null }) {
  if (!stamp) return null;
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, не HTML img: alt не поддерживается
    <Image src={stamp} style={styles.stampImage} />
  );
}
