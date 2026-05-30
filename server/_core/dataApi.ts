/**
 * dataApi — Manus Forge 데이터 API 스텁
 * 기존 코드에서 호출하는 곳이 있으면 경고 후 빈 응답 반환
 */
export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  console.warn(`[dataApi] callDataApi("${apiId}") not implemented — Forge dependency removed.`);
  return {};
}
