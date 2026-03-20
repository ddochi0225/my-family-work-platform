export function getAllowanceStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "대기 중";
    case "approved":
      return "승인됨";
    case "rejected":
      return "반려됨";
    default:
      return status;
  }
}

export function getAllowanceStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-50 text-yellow-700";
    case "approved":
      return "bg-emerald-50 text-emerald-600";
    case "rejected":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}