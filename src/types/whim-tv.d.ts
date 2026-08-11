export {};

declare global {
  interface Window {
    __whimTvSoundBoot?: boolean;
    __whimTvUnlocked?: boolean;
    __whimTvWantSound?: boolean;
    __whimTvUnmute?: () => void;
    __whimTvGuideLocal?: boolean;
    __whimTvFormatGuideTimes?: () => void;
  }
}
