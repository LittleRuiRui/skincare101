// Public catalog UUIDs and app-prefixed IDs refer to the same product.
export function matchesProductRouteId(productId:string,routeId:string){
  return productId.replace(/^shared-/,'')===routeId.replace(/^shared-/,'');
}
