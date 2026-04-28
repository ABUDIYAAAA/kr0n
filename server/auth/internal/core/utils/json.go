package utils

import "encoding/json"

func MarshalJSONMap(value map[string]any) ([]byte, error) {
	if value == nil {
		return nil, nil
	}

	payload, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}

	return payload, nil
}

func UnmarshalJSONMap(payload []byte) (map[string]any, error) {
	if len(payload) == 0 {
		return map[string]any{}, nil
	}

	var out map[string]any
	if err := json.Unmarshal(payload, &out); err != nil {
		return nil, err
	}

	if out == nil {
		out = map[string]any{}
	}

	return out, nil
}
