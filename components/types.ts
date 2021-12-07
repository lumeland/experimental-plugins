/** This is the Component interface */
export interface Component {
  /** Name of the component (used to get it from templates) */
  name: string;

  /** The function that will be called to render the component */
  render: (props: Record<string, unknown>) => string;

  /** Optional CSS code needed to style the component (global, only inserted once) */
  css?: string;

  /** Optional JS code needed for the component interactivity (global, only inserted once) */
  js?: string;
}

export type ComponentLoader = (path: string) => Promise<Component>;

export interface Components {
  components: Map<string, Component>;
  subComponents: Map<string, Components>;
  proxies: Map<string, ProxyComponents>;
}

export interface ProxyComponents {
  [key: string]: ((props: Record<string, unknown>) => string) | ProxyComponents;
}
