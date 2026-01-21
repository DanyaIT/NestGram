export interface EnvConfig {
  ALLOWED_ORIGIN: string;
  POSTGRES_URI: string;
  REDIS_PASSWORD: string;
  REDIS_USERNAME: string;
  REDIS_PORT: string;
  REDIS_HOST: string;
  S3_BUCKET_NAME: string;
  S3_REGION: string;
  S3_HOST: string;
  S3_KEY: string;
  S3_SECRET: string;
  JWT_SECRET: string;
}
