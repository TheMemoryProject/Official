export interface ManifestGeneratorInput {
  environment: string;
  replicas: number;
  deploymentMode: string;
}

export function generateKubernetesManifest(input: ManifestGeneratorInput): string {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ktn-app-${input.environment.toLowerCase()}
  labels:
    app.kubernetes.io/name: ktn-platform
    app.kubernetes.io/environment: ${input.environment}
spec:
  replicas: ${input.replicas}
  selector:
    matchLabels:
      app: ktn-web
  template:
    metadata:
      labels:
        app: ktn-web
    spec:
      containers:
      - name: ktn-platform
        image: ktn/platform:v1.0.0
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
          requests:
            cpu: "500m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /api/operations/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
`;
}
