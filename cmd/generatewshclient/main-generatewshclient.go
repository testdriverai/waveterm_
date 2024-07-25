// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"os"

	"github.com/wavetermdev/thenextwave/pkg/util/utilfn"
	"github.com/wavetermdev/thenextwave/pkg/wshrpc/wshserver"
	"github.com/wavetermdev/thenextwave/pkg/wshutil"
)

func genMethod_ResponseStream(fd *os.File, methodDecl *wshserver.WshServerMethodDecl) {
	fmt.Fprintf(fd, "// command %q, wshserver.%s\n", methodDecl.Command, methodDecl.MethodName)
	var dataType string
	dataVarName := "nil"
	if methodDecl.CommandDataType != nil {
		dataType = ", data " + methodDecl.CommandDataType.String()
		dataVarName = "data"
	}
	respType := "any"
	if methodDecl.DefaultResponseDataType != nil {
		respType = methodDecl.DefaultResponseDataType.String()
	}
	fmt.Fprintf(fd, "func %s(w *wshutil.WshRpc%s, opts *wshrpc.WshRpcCommandOpts) chan wshrpc.RespOrErrorUnion[%s] {\n", methodDecl.MethodName, dataType, respType)
	fmt.Fprintf(fd, "    return sendRpcRequestResponseStreamHelper[%s](w, %q, %s, opts)\n", respType, methodDecl.Command, dataVarName)
	fmt.Fprintf(fd, "}\n\n")
}

func genMethod_Call(fd *os.File, methodDecl *wshserver.WshServerMethodDecl) {
	fmt.Fprintf(fd, "// command %q, wshserver.%s\n", methodDecl.Command, methodDecl.MethodName)
	var dataType string
	dataVarName := "nil"
	if methodDecl.CommandDataType != nil {
		dataType = ", data " + methodDecl.CommandDataType.String()
		dataVarName = "data"
	}
	returnType := "error"
	respName := "_"
	tParamVal := "any"
	if methodDecl.DefaultResponseDataType != nil {
		returnType = "(" + methodDecl.DefaultResponseDataType.String() + ", error)"
		respName = "resp"
		tParamVal = methodDecl.DefaultResponseDataType.String()
	}
	fmt.Fprintf(fd, "func %s(w *wshutil.WshRpc%s, opts *wshrpc.WshRpcCommandOpts) %s {\n", methodDecl.MethodName, dataType, returnType)
	fmt.Fprintf(fd, "    %s, err := sendRpcRequestCallHelper[%s](w, %q, %s, opts)\n", respName, tParamVal, methodDecl.Command, dataVarName)
	if methodDecl.DefaultResponseDataType != nil {
		fmt.Fprintf(fd, "    return resp, err\n")
	} else {
		fmt.Fprintf(fd, "    return err\n")
	}
	fmt.Fprintf(fd, "}\n\n")
}

func main() {
	fd, err := os.Create("pkg/wshrpc/wshclient/wshclient.go")
	if err != nil {
		panic(err)
	}
	defer fd.Close()
	fmt.Fprintf(os.Stderr, "generating wshclient file to %s\n", fd.Name())
	fmt.Fprintf(fd, "// Copyright 2024, Command Line Inc.\n")
	fmt.Fprintf(fd, "// SPDX-License-Identifier: Apache-2.0\n\n")
	fmt.Fprintf(fd, "// generated by cmd/generatewshclient/main-generatewshclient.go\n\n")
	fmt.Fprintf(fd, "package wshclient\n\n")
	fmt.Fprintf(fd, "import (\n")
	fmt.Fprintf(fd, "	\"github.com/wavetermdev/thenextwave/pkg/wshutil\"\n")
	fmt.Fprintf(fd, "	\"github.com/wavetermdev/thenextwave/pkg/wshrpc\"\n")
	fmt.Fprintf(fd, "	\"github.com/wavetermdev/thenextwave/pkg/waveobj\"\n")
	fmt.Fprintf(fd, "	\"github.com/wavetermdev/thenextwave/pkg/waveai\"\n")
	fmt.Fprintf(fd, ")\n\n")

	for _, key := range utilfn.GetOrderedMapKeys(wshserver.WshServerCommandToDeclMap) {
		methodDecl := wshserver.WshServerCommandToDeclMap[key]
		if methodDecl.CommandType == wshutil.RpcType_ResponseStream {
			genMethod_ResponseStream(fd, methodDecl)
		} else if methodDecl.CommandType == wshutil.RpcType_Call {
			genMethod_Call(fd, methodDecl)
		} else {
			panic("unsupported command type " + methodDecl.CommandType)
		}
	}
	fmt.Fprintf(fd, "\n")
}
