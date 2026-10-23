/* Use the runtime's managed HTTPS route for public QA, without logging credentials. */
export function browserNetwork(url){
 const host=new URL(url).hostname;if(['127.0.0.1','localhost'].includes(host))return {};
 const value=process.env.HTTPS_PROXY||process.env.https_proxy;if(!value)return {};
 const p=new URL(value),proxy={server:p.protocol+'//'+p.host,bypass:'127.0.0.1,localhost'};
 if(p.username)proxy.username=decodeURIComponent(p.username);if(p.password)proxy.password=decodeURIComponent(p.password);return {proxy};
}
export function browserContextNetwork(url){
 // Only the disposable QA context accepts the runtime's TLS interception.
 // Product TLS, Firebase access and deployed configuration are unchanged.
 return browserNetwork(url).proxy?{ignoreHTTPSErrors:true}:{};
}
