export interface JError {
  code: number;       
  message: string;   
  details?: string;   
}

export interface ListResult<T> {
  list: T[];
  count: number;
}

export interface Response<T> {
  statusName: string;
  statusCode: number;
  payload: T;
  errors?: any;
}


