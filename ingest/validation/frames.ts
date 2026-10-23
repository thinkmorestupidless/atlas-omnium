// A frame the model does not know is rejected, by the same schema the application uses.
import { FrameSchema } from '../../app/src/model/schema';

export const checkFrame = (frame: unknown, where: string): string[] => {
  const r = FrameSchema.safeParse(frame);
  return r.success ? [] : [`${where}: unknown or malformed frame ${JSON.stringify(frame)}`];
};
