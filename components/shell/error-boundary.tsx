"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; title?: string };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[40vh] flex-col items-start justify-center gap-3 p-8">
          <h2 className="text-lg font-semibold text-[var(--danger)]">
            {this.props.title ?? "Something went wrong"}
          </h2>
          <p className="max-w-lg text-sm text-[var(--text-secondary)]">
            {this.state.error.message ||
              "An unexpected error occurred. Your data is safe."}
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
