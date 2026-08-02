import { Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import {
  ELIGIBILITY_EXEMPTION_REASON,
  EXEMPTION_REASON_LABELS,
  QUALITY_CERT_LABELS,
  type Business,
} from "../types/business.types";

interface BusinessExemptionTagProps {
  business: Business;
  /** Also render the exemption details as text next to the tag. */
  showDetail?: boolean;
}

/**
 * "Miễn GCN" tag for businesses exempt from the food-safety eligibility
 * certificate (Clause 1, Article 12 of Decree 15/2018/ND-CP). For the
 * point-k exemption it also surfaces the quality-system certification and
 * turns red once that certification has expired.
 */
export function BusinessExemptionTag({
  business,
  showDetail = false,
}: BusinessExemptionTagProps) {
  const reason = business.eligibilityExemptionReason;
  if (reason === undefined) return null;

  const isQualityCertified =
    reason === ELIGIBILITY_EXEMPTION_REASON.QualitySystemCertified;
  const expiry = business.qualityCertificationExpiry;
  const certExpired =
    isQualityCertified &&
    Boolean(expiry) &&
    dayjs(expiry).isBefore(dayjs(), "day");

  const lines = [EXEMPTION_REASON_LABELS[reason]];
  if (isQualityCertified) {
    const type = business.qualityCertificationType;
    lines.push(
      `${type !== undefined ? QUALITY_CERT_LABELS[type] : "Chứng nhận"} số ${
        business.qualityCertificationNumber ?? "—"
      }`,
    );
    if (expiry) {
      lines.push(
        `${certExpired ? "Đã hết hạn" : "Hết hạn"}: ${dayjs(expiry).format(
          "DD/MM/YYYY",
        )}`,
      );
    }
  }
  const detail = lines.join(" — ");

  return (
    <>
      <Tooltip title={detail}>
        <Tag color={certExpired ? "red" : "gold"}>
          {certExpired ? "Miễn GCN (CN hết hạn)" : "Miễn GCN"}
        </Tag>
      </Tooltip>
      {showDetail && (
        <Typography.Text type={certExpired ? "danger" : "secondary"}>
          {detail}
        </Typography.Text>
      )}
    </>
  );
}
