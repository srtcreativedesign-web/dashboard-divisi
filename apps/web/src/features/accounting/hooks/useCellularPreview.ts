import { useMutation } from '@tanstack/react-query';
import { cellularPreviewApi } from '../api/cellularPreview';

export function useCellularPreview() {
  return useMutation({ mutationFn: cellularPreviewApi.preview });
}
