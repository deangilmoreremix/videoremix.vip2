import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  threshold?: number;
}

const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  threshold = 0.1,
  ...props
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [inView, shouldLoad]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          {...props}
        />
      ) : (
        <div
          className="w-full h-full bg-gray-900 flex items-center justify-center"
          style={{ aspectRatio: '16/9' }}
        >
          {poster && <img src={poster} alt="" className="w-full h-full object-cover" />}
        </div>
      )}
    </div>
  );
};

export default LazyVideo;
