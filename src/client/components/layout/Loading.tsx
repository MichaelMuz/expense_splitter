import { Layout } from './Layout';

export function Loading({ name }: { name?: string }) {
    const fullMessage = name ? `Loading ${name}...` : 'Loading...';
    return <Layout> <p> {fullMessage} </p> </Layout>

}
