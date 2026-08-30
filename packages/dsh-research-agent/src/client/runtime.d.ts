/**
 * 宿主浏览器运行时的最小环境声明：树外包不安装 @deepseek-ai 依赖，
 * 这里只声明本插件用到的导出（签名与部署端 .d.ts 核对过）。
 */
declare module '@deepseek-ai/dsh-client-runtime/client' {
  interface SnapshotStoreLike<T> {
    getSnapshot(): T
    subscribe(fn: () => void): () => void
    update(mutator: (draft: T) => void): void
    set(next: T): void
  }
  export function createSnapshotStore<T>(
    initial: T,
    options?: { persist?: { name: string } },
  ): SnapshotStoreLike<T>
}
