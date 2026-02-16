/**
 * Video Player Component
 * Supports YouTube URLs and direct video URLs (mp4, webm, etc.)
 */

'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, thumbnailUrl, onTimeUpdate, onDurationChange, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(1);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();

    // Determine if URL is YouTube
    const youtubeVideoId = getYouTubeVideoId(videoUrl);
    const isYouTube = !!youtubeVideoId;

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (isYouTube && iframeRef.current) {
          // For YouTube, we need to use postMessage API
          // Note: This requires YouTube IFrame API to be properly initialized
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [time, true],
            }),
            '*'
          );
        } else if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      },
      play: () => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
    }));

    // Video player controls
    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
      }
    };

    const toggleFullscreen = () => {
      if (videoRef.current) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          videoRef.current.requestFullscreen();
        }
      }
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        const time = video.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      };

      const handleLoadedMetadata = () => {
        const dur = video.duration;
        setDuration(dur);
        onDurationChange?.(dur);
      };

      const handleEnded = () => {
        setIsPlaying(false);
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
      };
    }, [onTimeUpdate, onDurationChange]);

    // For YouTube videos, use iframe embed with enablejsapi
    if (isYouTube) {
      return (
        <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-lg ${className}`}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0&modestbranding=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    }

    // For direct video URLs, use HTML5 video player
    return (
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-lg ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          poster={thumbnailUrl}
          onClick={togglePlay}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>

        {/* Video Controls Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Center Play Button (when paused) */}
          {!isPlaying && (
            <div className="flex h-full items-center justify-center">
              <button
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
              >
                <Play className="h-8 w-8 fill-current text-brand" />
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white transition-transform hover:scale-110"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="text-white transition-transform hover:scale-110"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="h-6 w-6" />
                  ) : (
                    <Volume2 className="h-6 w-6" />
                  )}
                </button>
                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
                <div className="text-sm font-medium text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-white transition-transform hover:scale-110"
                  aria-label="Settings"
                >
                  <Settings className="h-6 w-6" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="text-white transition-transform hover:scale-110"
                  aria-label="Fullscreen"
                >
                  <Maximize className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
