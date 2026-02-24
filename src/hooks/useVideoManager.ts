import { useEffect, useRef } from "react";

const activeVideos = new Set<HTMLVideoElement>();
const MAX_CONCURRENT_VIDEOS = 5;

export const useVideoManager = (
  videoRef: React.RefObject<HTMLVideoElement>,
) => {
  const isRegistered = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (activeVideos.size >= MAX_CONCURRENT_VIDEOS) {
        const firstVideo = Array.from(activeVideos)[0];
        if (firstVideo && firstVideo !== video) {
          firstVideo.pause();
          activeVideos.delete(firstVideo);
        }
      }
      activeVideos.add(video);
      isRegistered.current = true;
    };

    const handlePause = () => {
      activeVideos.delete(video);
      isRegistered.current = false;
    };

    const handleEnded = () => {
      activeVideos.delete(video);
      isRegistered.current = false;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (isRegistered.current) {
        activeVideos.delete(video);
      }
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef]);

  return {
    activeCount: activeVideos.size,
    maxCount: MAX_CONCURRENT_VIDEOS,
  };
};
