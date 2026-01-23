import { Composition } from "remotion";
import { SamplePadDemo } from "./SamplePadDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SamplePadDemo"
      component={SamplePadDemo}
      durationInFrames={450} // 15 seconds at 30fps
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
