'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { TreeView } from '@/components/TreeView/TreeView';
import { Node, NodeService } from '@/library/powersync/NodeService';
import { usePowerSync, useQuery } from '@powersync/react';
import { useStatus } from '@powersync/react';
import { AbstractPowerSyncDatabase } from '@powersync/web';
import store from '@/stores/RootStore';
import { observer } from 'mobx-react-lite';
import { v5 as uuidv5 } from 'uuid';
import { userService } from '@/library/powersync/userService';
import { measureOnce, METRICS, registerLastSync, registerStart } from '@/utils/metrics';
import { queries } from '@/library/powersync/queries';

type NodeWithChildren = Node & { has_children: 0 | 1 };

const Home = observer(() => {
  const db = usePowerSync();
  const prevSelectedNodeIdRef = useRef<string | null>(null);

  if (!db) throw new Error('PowerSync context not found');

  const local_id = store.session?.user?.user_metadata?.local_id;
  const [nodeService] = useState(() => new NodeService(db as AbstractPowerSyncDatabase));
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const queryParams = useMemo(() => {
    return [JSON.stringify(Array.from(expandedNodes))];
  }, [expandedNodes]);

  const { data: loadedNodes } = useQuery<NodeWithChildren>(queries.getVisibleNodes.sql, queryParams);
  const { data: allNodes } = useQuery(queries.countAllNodes.sql);
  const { data: userNodes } = useQuery(queries.countUserNodes.sql, [local_id]);
  const { data: pendingUpload } = useQuery(queries.countPendingUploads.sql);
  const { downloadProgress, dataFlowStatus, connected, hasSynced } = useStatus();

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
        store.setSelectedNodeId(nodeId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (store.selectedNodeId && store.selectedNodeId !== prevSelectedNodeIdRef.current) {
      if (!expandedNodes.has(store.selectedNodeId)) {
        const node = loadedNodes.find((n) => n.id === store.selectedNodeId);
        if (node && node.has_children) {
          setExpandedNodes((prev) => new Set(prev).add(node.id!));
        }
      }
    }
    prevSelectedNodeIdRef.current = store.selectedNodeId;
  }, [store.selectedNodeId, expandedNodes, loadedNodes]);

  useEffect(() => {
    registerStart();
  }, []);

  useEffect(() => {
    registerLastSync();
  }, [loadedNodes]);

  useEffect(() => {
    if (!store.selectedNodeId) {
      store.setSelectedNodeId(uuidv5("ROOT_NODE", userService.getUserId()));
    }
  }, []);

  if (allNodes[0]?.count > 0) {
    measureOnce(METRICS.TIME_TO_INTERACTION);
  }

  return (
    <main className="flex h-[calc(100vh-theme(spacing.16))]">
      <aside className="hidden sm:flex sm:w-72 py-1 px-2 border-r flex-col gap-0.5 text-xs">
        <div className="mb-2 pb-2 border-b border-gray-200">
          <a
            href="/perf"
            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
          >
            🔍 Performance Testing
          </a>
        </div>

        <div className="text-gray-600 leading-tight">User nodes: <b className="text-black">{userNodes[0]?.count ?? 0}</b></div>
        <div className="text-gray-600 leading-tight">Selected ID: <b className="text-black truncate block">{store.selectedNodeId}</b></div>
        <div className="text-gray-600 leading-tight">Selected nodes count: <b className="text-black">{store._syncedNodes.length}</b></div>
        <div className="leading-tight">
          {connected ?
            <span className='text-green-500'>Connected to sync server</span> :
            <span className='text-red-500'>Offline</span>}
          {' • '}
          {hasSynced ?
            <span className='text-green-500'>Initial sync done</span> :
            <span className='text-red-500'>Pending initial sync</span>}
        </div>
        {dataFlowStatus.downloading && (
          <>
            <div className="text-blue-600 leading-tight">
              <div>Downloading...</div>
              <div>
                {downloadProgress.downloadedOperations}
                / {downloadProgress.totalOperations}
                {` `} ({Math.round(downloadProgress.downloadedFraction * 10000) / 100}%)
              </div>
            </div>
          </>
        )}
        {dataFlowStatus.uploading && <>
          <div className="text-blue-600 leading-tight">
            Uploading... ({pendingUpload[0]?.count ?? 0})
          </div>
        </>}
      </aside>
      <section className="flex-1 h-full overflow-y-auto">
        <TreeView
          nodes={loadedNodes || []}
          nodeService={nodeService}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
        />
      </section>
    </main>
  );
});

export default Home;
