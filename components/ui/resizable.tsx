"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as RP from "react-resizable-panels";
import { cn } from "./utils";

// Делаем совместимость по типам с любыми версиями react-resizable-panels
const PanelGroupAny = (RP as any).PanelGroup;
const PanelAny = (RP as any).Panel;
const PanelResizeHandleAny = (RP as any).PanelResizeHandle;

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<"div"> & Record<string, any>) {
  // Если вдруг в установленной версии нет PanelGroup — рендерим просто wrapper
  if (!PanelGroupAny) {
    return (
      <div
        data-slot="resizable-panel-group"
        className={cn("flex h-full w-full", className)}
        {...props}
      />
    );
  }

  return (
    <PanelGroupAny
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<"div"> & Record<string, any>) {
  if (!PanelAny) {
    return (
      <div
        data-slot="resizable-panel"
        className={cn("min-w-0 min-h-0", className)}
        {...props}
      />
    );
  }

  return (
    <PanelAny
      data-slot="resizable-panel"
      className={cn("min-w-0 min-h-0", className)}
      {...props}
    />
  );
}

function ResizableHandle({
  className,
  withHandle,
  ...props
}: React.ComponentProps<"div"> &
  Record<string, any> & { withHandle?: boolean }) {
  if (!PanelResizeHandleAny) {
    return (
      <div
        data-slot="resizable-handle"
        className={cn(
          "relative flex w-px items-center justify-center bg-border",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <PanelResizeHandleAny
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-background">
          <GripVerticalIcon className="h-2.5 w-2.5" />
        </div>
      ) : null}
    </PanelResizeHandleAny>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
