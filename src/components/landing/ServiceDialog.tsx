import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import hyperkidsBgAsset from '@/assets/hyperkids-dialog-bg.png.asset.json';
import hypergymBgAsset from '@/assets/hypergym-dialog-bg.png.asset.json';
import hyperathletesBgAsset from '@/assets/hyperathletes-dialog-bg.png.asset.json';
import hyperkidsLogoAsset from '@/assets/hyperkids-logo-transparent.png.asset.json';
import hypergymLogoAsset from '@/assets/hypergym-logo-transparent.png.asset.json';
import hyperathletesLogoAsset from '@/assets/hyperathletes-logo-transparent.png.asset.json';
import hyperkidsIconAsset from '@/assets/service-icon-hyperkids.png.asset.json';
import hypergymIconAsset from '@/assets/service-icon-hypergym.png.asset.json';
import hyperathletesIconAsset from '@/assets/service-icon-hyperathletes.png.asset.json';

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
}

const SERVICE_CONFIG: Record<string, {
  bg: string;
  logo: string;
  icon: string;
  taglineWhite: string;
  taglineColor: string;
  color: string;
}> = {
  "10": {
    bg: hyperkidsBgAsset.url,
    logo: hyperkidsLogoAsset.url,
    icon: hyperkidsIconAsset.url,
    taglineWhite: "trust the ",
    taglineColor: "process",
    color: "#00ffba",
  },
  "11": {
    bg: hypergymBgAsset.url,
    logo: hypergymLogoAsset.url,
    icon: hypergymIconAsset.url,
    taglineWhite: "go the ",
    taglineColor: "extra mile",
    color: "#cb8954",
  },
  "13": {
    bg: hyperathletesBgAsset.url,
    logo: hyperathletesLogoAsset.url,
    icon: hyperathletesIconAsset.url,
    taglineWhite: "go the ",
    taglineColor: "limit",
    color: "#f84536",
  },
};

export const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onOpenChange,
  programId,
}) => {
  const config = programId ? SERVICE_CONFIG[programId] : null;

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border-0 bg-transparent p-0 shadow-none max-w-[90vw] w-[1200px] rounded-none overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.bg})` }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 text-white hover:opacity-80 transition-opacity"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Logo top-left */}
        <div className="absolute top-6 left-6 z-40">
          <img
            src={config.logo}
            alt=""
            className="w-[140px] h-auto object-contain"
          />
        </div>

        {/* Icon bottom-left */}
        <div className="absolute bottom-6 left-6 z-40">
          <img
            src={config.icon}
            alt=""
            className="w-[76px] h-[76px] object-contain opacity-90"
          />
        </div>

        {/* Tagline bottom-right */}
        <div className="absolute bottom-6 right-6 z-40">
          <span
            style={{
              fontFamily: "'UnifrakturMaguntia', serif",
              fontSize: '2.5rem',
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: '#ffffff' }}>{config.taglineWhite}</span>
            <span style={{ color: config.color }}>{config.taglineColor}</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
