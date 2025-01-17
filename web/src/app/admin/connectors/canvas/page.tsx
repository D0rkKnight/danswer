"use client";

import * as Yup from "yup";
import { BookstackIcon, CanvasIcon, TrashIcon } from "@/components/icons/icons";
import { TextFormField } from "@/components/admin/connectors/Field";
import { HealthCheckBanner } from "@/components/health/healthcheck";
import { CredentialForm } from "@/components/admin/connectors/CredentialForm";
import {
  CanvasCredentialJson,
  CanvasConfig,
  ConnectorIndexingStatus,
  Credential,
} from "@/lib/types";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { LoadingAnimation } from "@/components/Loading";
import { adminDeleteCredential, linkCredential } from "@/lib/credential";
import { ConnectorForm } from "@/components/admin/connectors/ConnectorForm";
import { ConnectorsTable } from "@/components/admin/connectors/table/ConnectorsTable";
import { usePopup } from "@/components/admin/connectors/Popup";
import { usePublicCredentials } from "@/lib/hooks";

const Main = () => {
  const { popup, setPopup } = usePopup();

  const { mutate } = useSWRConfig();
  const {
    data: connectorIndexingStatuses,
    isLoading: isConnectorIndexingStatusesLoading,
    error: isConnectorIndexingStatusesError,
  } = useSWR<ConnectorIndexingStatus<any, any>[]>(
    "/api/manage/admin/connector/indexing-status",
    fetcher
  );
  const {
    data: credentialsData,
    isLoading: isCredentialsLoading,
    error: isCredentialsError,
    refreshCredentials,
  } = usePublicCredentials();

  if (
    (!connectorIndexingStatuses && isConnectorIndexingStatusesLoading) ||
    (!credentialsData && isCredentialsLoading)
  ) {
    return <LoadingAnimation text="Loading" />;
  }

  if (isConnectorIndexingStatusesError || !connectorIndexingStatuses) {
    return <div>Failed to load connectors</div>;
  }

  if (isCredentialsError || !credentialsData) {
    return <div>Failed to load credentials</div>;
  }

  const canvasConnectorIndexingStatuses: ConnectorIndexingStatus<
    CanvasConfig,
    CanvasCredentialJson
  >[] = connectorIndexingStatuses.filter(
    (connectorIndexingStatus) =>
      connectorIndexingStatus.connector.source === "canvas"
  );
  const canvasCredential: Credential<CanvasCredentialJson> | undefined =
    credentialsData.find(
      (credential) => credential.credential_json?.canvas_api_key
    );

  return (
    <>
      {popup}
      <h2 className="font-bold mb-2 mt-6 ml-auto mr-auto">
        Step 1: Provide your API details
      </h2>

      {canvasCredential ? (
        <>
          <div className="flex mb-1 text-sm">
            <p className="my-auto">Existing API Key: </p>
            <p className="ml-1 italic my-auto max-w-md">
              {canvasCredential.credential_json?.canvas_api_key}
            </p>
            <button
              className="ml-1 hover:bg-gray-700 rounded-full p-1"
              onClick={async () => {
                if (canvasConnectorIndexingStatuses.length > 0) {
                  setPopup({
                    type: "error",
                    message:
                      "Must delete all connectors before deleting credentials",
                  });
                  return;
                }
                await adminDeleteCredential(canvasCredential.id);
                refreshCredentials();
              }}
            >
              <TrashIcon />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            To get started you&apos;ll need API token details for your Canvas
            instance. You can get these by editing your (or another) user
            account in Canvas and creating a token via the &apos;API
            Tokens&apos; section in your user settings.
          </p>
          <div className="border-solid border-gray-600 border rounded-md p-6 mt-2 mb-4">
            <CredentialForm<CanvasCredentialJson>
              formBody={
                <>
                  <TextFormField
                    name="canvas_base_url"
                    label="Instance Base URL:"
                  />
                  <TextFormField
                    name="canvas_api_key"
                    label="API Key:"
                  />
                </>
              }
              validationSchema={Yup.object().shape({
                canvas_base_url: Yup.string().required(
                  "Please enter the base URL for your Canvas instance"
                ),
                canvas_api_key: Yup.string().required(
                  "Please enter your Canvas API token ID"
                ),
              })}
              initialValues={{
                canvas_base_url: "",
                canvas_api_key: "",
              }}
              onSubmit={(isSuccess) => {
                if (isSuccess) {
                  refreshCredentials();
                  mutate("/api/manage/admin/connector/indexing-status");
                }
              }}
            />
          </div>
        </>
      )}

      {canvasConnectorIndexingStatuses.length > 0 && (
        <>
          <h2 className="font-bold mb-2 mt-6 ml-auto mr-auto">
            Canvas indexing status
          </h2>
          <p className="text-sm mb-2">
            The Canvas files are fetched every 10 minutes
          </p>
          <div className="mb-2">
            <ConnectorsTable<CanvasConfig, CanvasCredentialJson>
              connectorIndexingStatuses={canvasConnectorIndexingStatuses}
              liveCredential={canvasCredential}
              getCredential={(credential) => {
                return (
                  <div>
                    <p>{credential.credential_json.canvas_api_key}</p>
                  </div>
                );
              }}
              onCredentialLink={async (connectorId) => {
                if (canvasCredential) {
                  await linkCredential(connectorId, canvasCredential.id);
                  mutate("/api/manage/admin/connector/indexing-status");
                }
              }}
              onUpdate={() =>
                mutate("/api/manage/admin/connector/indexing-status")
              }
            />
          </div>
        </>
      )}

      {canvasCredential &&
        canvasConnectorIndexingStatuses.length === 0 && (
          <>
            <div className="border-solid border-gray-600 border rounded-md p-6 mt-4">
              <h2 className="font-bold mb-3">Create Connection</h2>
              <p className="text-sm mb-4">
                Press connect below to start the connection to your Canvas
                instance.
              </p>
              <ConnectorForm<CanvasConfig>
                nameBuilder={(values) => `CanvasConnector`}
                ccPairNameBuilder={(values) => `CanvasConnector`}
                source="canvas"
                inputType="load_state"
                formBody={<></>}
                validationSchema={Yup.object().shape({})}
                initialValues={{}}
                refreshFreq={10 * 60} // 10 minutes
                credentialId={canvasCredential.id}
              />
            </div>
          </>
        )}

      {!canvasCredential && (
        <>
          <p className="text-sm mb-4">
            Please provide your API details in Step 1 first! Once done with
            that, you&apos;ll be able to start the connection then see indexing
            status.
          </p>
        </>
      )}
    </>
  );
};

export default function Page() {
  return (
    <div className="mx-auto container">
      <div className="mb-4">
        <HealthCheckBanner />
      </div>
      <div className="border-solid border-gray-600 border-b mb-4 pb-2 flex">
        <CanvasIcon size={32} />
        <h1 className="text-3xl font-bold pl-2">Canvas</h1>
      </div>
      <Main />
    </div>
  );
}
